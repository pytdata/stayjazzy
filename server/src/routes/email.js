import crypto from 'crypto';
import express from 'express';
import fetch from 'node-fetch';
import readXlsxFile from 'read-excel-file/node';
import { query } from '../db.js';
import { ensureSchema } from '../schema.js';
import {
  assertEmailConfigured,
  buildBookingConfirmationEmail,
  buildInvoiceEmail,
  buildOtpEmail,
  buildPaymentRequestEmail,
  buildReceiptEmail,
  describeEmailError,
  getEmailDiagnostics,
  sendEmail as sendSmtpEmail,
  verifyEmailConnection,
} from '../emailService.js';

export const emailRouter = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const EMAIL_SCAN_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripTags = (html = '') =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeHtml = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isPublicHttpUrl = (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  return !(
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
};

const googleDriveDownloadUrl = (rawUrl) => {
  const url = new URL(rawUrl);
  if (!/(\.|^)google\.(com|[a-z.]+)$/.test(url.hostname) && !url.hostname.includes('drive.google.com') && !url.hostname.includes('docs.google.com')) {
    return rawUrl;
  }

  const idFromQuery = url.searchParams.get('id');
  if (idFromQuery) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFromQuery)}`;

  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileMatch[1])}`;

  const sheetMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (sheetMatch) return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetMatch[1])}/export?format=xlsx`;

  return rawUrl;
};

const extractEmailsFromRows = (rows) => {
  const found = new Map();

  for (const row of rows) {
    const cells = Array.isArray(row) ? row : [row];
    for (const cell of cells) {
      const matches = String(cell ?? '').match(EMAIL_SCAN_RE) || [];
      for (const match of matches) {
        const email = normalizeEmail(match);
        if (EMAIL_RE.test(email)) found.set(email, { email, source: 'import' });
      }
    }
  }

  return Array.from(found.values());
};

const extractEmailsFromText = (text) => extractEmailsFromRows(text.split(/\r?\n/));

const extractEmailsFromFile = async (buffer, contentType, sourceUrl) => {
  const isCsv =
    /(^|[/;])(csv|plain|text)/i.test(contentType || '') ||
    /\.csv($|[?#])/i.test(sourceUrl);

  if (isCsv) {
    return extractEmailsFromText(buffer.toString('utf8'));
  }

  const rows = await readXlsxFile(buffer);
  return extractEmailsFromRows(rows);
};

const getPublicApiBaseUrl = (req) =>
  process.env.PUBLIC_API_URL ||
  process.env.BACKEND_PUBLIC_URL ||
  `${req.protocol}://${req.get('host')}`;

const unsubscribeToken = (email) =>
  crypto
    .createHmac('sha256', process.env.NEWSLETTER_SECRET || process.env.SMTP_PASS || 'stay-jazzy-newsletter')
    .update(normalizeEmail(email))
    .digest('hex');

const buildUnsubscribeUrl = (req, email) => {
  const base = getPublicApiBaseUrl(req).replace(/\/$/, '');
  const params = new URLSearchParams({ email: normalizeEmail(email), token: unsubscribeToken(email) });
  return `${base}/api/email/unsubscribe?${params.toString()}`;
};

const appendUnsubscribeNotice = (req, html, email) => {
  const unsubscribeUrl = buildUnsubscribeUrl(req, email);
  const notice = `
    <div style="margin-top:32px;padding-top:18px;border-top:1px solid #e5e7eb;color:#6b7280;font:12px/1.5 Arial,sans-serif">
      You are receiving this newsletter from Stay Jazzy Multimedia.
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#111827">Unsubscribe</a>
    </div>`;
  return `${html}${notice}`;
};

const handleEmailError = (error, res) => {
  if (error?.code === 'EMAIL_NOT_CONFIGURED') {
    console.error('Email configuration error:', error.message);
    return res.status(503).json({
      error: 'Email service is not configured. Please contact support.',
      code: 'EMAIL_NOT_CONFIGURED',
    });
  }

  if (error?.code === 'INVALID_EMAIL_PAYLOAD') {
    return res.status(400).json({ error: 'Missing required email fields' });
  }

  const details = describeEmailError(error);
  console.error('Email send error:', {
    code: details.code,
    responseCode: details.responseCode,
    command: details.command,
    hint: details.hint,
  });
  return res.status(502).json({
    error: 'Email could not be delivered. Please try again shortly.',
    code: details.code,
    responseCode: details.responseCode,
    hint: details.hint,
  });
};

const deliverEmail = ({ to, subject, html, text, replyTo }) =>
  sendSmtpEmail({ to, subject, html, text, replyTo });

emailRouter.get('/status', async (req, res) => {
  try {
    assertEmailConfigured();
    const diagnostics = getEmailDiagnostics();
    if (req.query.verify === 'true') {
      await verifyEmailConnection();
      return res.json({ ...diagnostics, smtpVerified: true });
    }
    res.json(diagnostics);
  } catch (error) {
    if (error?.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        ...getEmailDiagnostics(),
        error: 'Email service is not configured.',
        missing: error?.missing || [],
      });
    }

    const details = describeEmailError(error);
    res.status(502).json({
      ...getEmailDiagnostics(),
      smtpVerified: false,
      error: 'SMTP verification failed.',
      code: details.code,
      responseCode: details.responseCode,
      hint: details.hint,
    });
  }
});

emailRouter.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text, replyTo } = req.body;
    const info = await deliverEmail({ to, subject, html: sanitizeHtml(html), text, replyTo });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/otp', async (req, res) => {
  try {
    const { to, otp, purpose, expiresInMinutes } = req.body;
    const message = buildOtpEmail({ otp, purpose, expiresInMinutes });
    const info = await deliverEmail({ to, ...message });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/booking-confirmation', async (req, res) => {
  try {
    const { booking } = req.body;
    const message = buildBookingConfirmationEmail({ booking });
    const info = await deliverEmail({ to: booking?.user_email, ...message });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/payment-request', async (req, res) => {
  try {
    const { booking, paymentRequest, invoice, dashboardUrl } = req.body;
    const recipient = booking?.user_email || invoice?.customer_email;
    const message = buildPaymentRequestEmail({ booking, paymentRequest, invoice, dashboardUrl });
    const info = await deliverEmail({ to: recipient, ...message });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/invoice', async (req, res) => {
  try {
    const { invoice, dashboardUrl } = req.body;
    const message = buildInvoiceEmail({ invoice, dashboardUrl });
    const info = await deliverEmail({ to: invoice?.customer_email, ...message });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/receipt', async (req, res) => {
  try {
    const { receipt, invoice } = req.body;
    const message = buildReceiptEmail({ receipt, invoice });
    const info = await deliverEmail({ to: receipt?.customer_email || invoice?.customer_email, ...message });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    handleEmailError(error, res);
  }
});

emailRouter.post('/newsletter/import', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !isPublicHttpUrl(url)) {
      return res.status(400).json({ error: 'Enter a public Google Drive, CSV, or Excel file URL.' });
    }

    const downloadUrl = googleDriveDownloadUrl(url);
    const response = await fetch(downloadUrl, {
      redirect: 'follow',
      size: MAX_IMPORT_BYTES,
      headers: { 'User-Agent': 'StayJazzyNewsletterImporter/1.0' },
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Unable to fetch file (${response.status}). Make sure sharing is public.` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const recipients = await extractEmailsFromFile(buffer, response.headers.get('content-type'), downloadUrl);
    res.json({ recipients, count: recipients.length });
  } catch (error) {
    console.error('Newsletter import error:', error?.message || 'Unknown error');
    res.status(500).json({ error: 'Failed to import recipients from that file.' });
  }
});

emailRouter.post('/newsletter/publish', async (req, res) => {
  try {
    await ensureSchema();
    assertEmailConfigured();

    const { subject, html, text, recipients } = req.body;
    const cleanSubject = String(subject || '').trim();
    const cleanHtml = sanitizeHtml(html || '');
    const uniqueRecipients = new Map();

    for (const recipient of recipients || []) {
      const email = normalizeEmail(typeof recipient === 'string' ? recipient : recipient.email);
      if (EMAIL_RE.test(email)) {
        uniqueRecipients.set(email, {
          email,
          source: typeof recipient === 'string' ? 'manual' : recipient.source || 'subscriber',
        });
      }
    }

    if (!cleanSubject) return res.status(400).json({ error: 'Subject is required.' });
    if (!cleanHtml || !stripTags(cleanHtml)) return res.status(400).json({ error: 'Newsletter content is required.' });
    if (uniqueRecipients.size === 0) return res.status(400).json({ error: 'Select at least one recipient.' });

    const campaign = await query(
      `INSERT INTO newsletter_campaigns (subject, html, text, recipient_count, status)
       VALUES ($1, $2, $3, $4, 'sending')
       RETURNING id`,
      [cleanSubject, cleanHtml, text || stripTags(cleanHtml), uniqueRecipients.size]
    );

    const campaignId = campaign.rows[0].id;
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const recipient of uniqueRecipients.values()) {
      try {
        const unsubscribeUrl = buildUnsubscribeUrl(req, recipient.email);
        const info = await deliverEmail({
          to: recipient.email,
          subject: cleanSubject,
          html: appendUnsubscribeNotice(req, cleanHtml, recipient.email),
          text: `${text || stripTags(cleanHtml)}\n\nUnsubscribe: ${unsubscribeUrl}`,
        });
        sentCount++;
        await query(
          `INSERT INTO newsletter_sends (campaign_id, recipient_email, recipient_source, status, message_id)
           VALUES ($1, $2, $3, 'sent', $4)`,
          [campaignId, recipient.email, recipient.source, info.messageId || null]
        );
        results.push({ email: recipient.email, status: 'sent' });
      } catch (error) {
        failedCount++;
        await query(
          `INSERT INTO newsletter_sends (campaign_id, recipient_email, recipient_source, status, error)
           VALUES ($1, $2, $3, 'failed', $4)`,
          [campaignId, recipient.email, recipient.source, error.message || String(error)]
        );
        results.push({ email: recipient.email, status: 'failed', error: error.message || String(error) });
      }
    }

    await query(
      `UPDATE newsletter_campaigns
       SET sent_count = $1, failed_count = $2, status = $3, sent_at = NOW()
       WHERE id = $4`,
      [sentCount, failedCount, failedCount > 0 ? 'completed_with_errors' : 'sent', campaignId]
    );

    res.json({
      success: failedCount === 0,
      campaignId,
      sentCount,
      failedCount,
      results,
    });
  } catch (error) {
    if (error?.code === 'EMAIL_NOT_CONFIGURED') {
      return handleEmailError(error, res);
    }
    console.error('Newsletter publish error:', error?.message || 'Unknown error');
    res.status(500).json({ error: 'Failed to publish newsletter.' });
  }
});

emailRouter.get('/unsubscribe', async (req, res) => {
  try {
    await ensureSchema();
    const email = normalizeEmail(req.query.email);
    const token = String(req.query.token || '');
    if (!EMAIL_RE.test(email) || token !== unsubscribeToken(email)) {
      return res.status(400).send('<h1>Invalid unsubscribe link</h1>');
    }

    await query(
      `UPDATE newsletter_subscribers
       SET is_subscribed = FALSE, unsubscribed_at = NOW()
       WHERE email = $1`,
      [email]
    );

    res.send(`
      <!doctype html>
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family:Arial,sans-serif;padding:40px;color:#111827">
          <h1>You have been unsubscribed</h1>
          <p>${escapeHtml(email)} will no longer receive Stay Jazzy Multimedia newsletters.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error?.message || 'Unknown error');
    res.status(500).send('<h1>Unable to unsubscribe right now</h1>');
  }
});
