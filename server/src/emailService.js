import nodemailer from 'nodemailer';

const BRAND_NAME = 'Stay Jazzy Multimedia';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Stay Jazzy';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function parseBoolean(value) {
  if (value === undefined || value === null || value === '') return null;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT || '587';
  const port = Number.parseInt(portValue, 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const explicitSecure = parseBoolean(process.env.SMTP_SECURE);
  const secure = explicitSecure ?? port === 465;
  const fromEmail = process.env.EMAIL_FROM || user;

  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');
  if (!fromEmail) missing.push('EMAIL_FROM or SMTP_USER');
  if (fromEmail && !fromEmail.includes('<') && !EMAIL_RE.test(fromEmail)) missing.push('EMAIL_FROM must be an email address');
  if (!Number.isInteger(port) || port <= 0) missing.push('SMTP_PORT');

  return { host, port, secure, user, pass, fromEmail, missing };
}

export function assertEmailConfigured() {
  const config = getSmtpConfig();
  if (config.missing.length > 0) {
    const error = new Error(`Email service is not configured: ${config.missing.join(', ')}`);
    error.code = 'EMAIL_NOT_CONFIGURED';
    error.missing = config.missing;
    throw error;
  }
  return config;
}

function createTransporter() {
  const config = assertEmailConfigured();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function getFromAddress(config) {
  if (config.fromEmail.includes('<')) return config.fromEmail;
  return `"${DEFAULT_FROM_NAME}" <${config.fromEmail}>`;
}

export function getEmailDiagnostics() {
  const config = getSmtpConfig();
  return {
    configured: config.missing.length === 0,
    missing: config.missing,
    host: config.host || null,
    port: Number.isInteger(config.port) ? config.port : null,
    secure: config.secure,
    fromConfigured: Boolean(config.fromEmail),
    fromLooksValid: Boolean(config.fromEmail && (config.fromEmail.includes('<') || EMAIL_RE.test(config.fromEmail))),
  };
}

export function describeEmailError(error) {
  const code = error?.code || 'EMAIL_DELIVERY_FAILED';
  const responseCode = error?.responseCode;
  const command = error?.command;
  const response = String(error?.response || error?.message || '').slice(0, 300);
  let hint = 'The SMTP server rejected or did not complete the delivery request.';

  if (code === 'EAUTH' || responseCode === 535) {
    hint = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS. Gmail requires an App Password, not the normal account password.';
  } else if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET'].includes(code)) {
    hint = 'Could not connect to the SMTP server. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, and whether the provider allows SMTP from Vercel.';
  } else if (responseCode === 550 || responseCode === 553) {
    hint = 'The sender or recipient was rejected. Check EMAIL_FROM and whether the sender is verified with your SMTP provider.';
  } else if (responseCode === 534) {
    hint = 'The provider requires additional authentication setup, such as enabling SMTP access or using an app-specific password.';
  }

  return { code, responseCode, command, response, hint };
}

export async function verifyEmailConnection() {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderLayout({ preheader, title, intro, body, footer }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f2ea;color:#201c18;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2ea;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #eadfce;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#111111;color:#ffffff;padding:22px 26px;">
                <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#d6b15f;">${escapeHtml(BRAND_NAME)}</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#3a342e;">${intro}</p>
                ${body}
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#74695d;">${footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderServiceList(services = []) {
  if (!Array.isArray(services) || services.length === 0) {
    return '<p style="margin:0;color:#3a342e;">Selected services will be confirmed by our team.</p>';
  }

  const rows = services.map(service => {
    const name = escapeHtml(service.tier_name || service.sub_service_name || 'Selected service');
    const packageName = escapeHtml(service.package_name || 'Service package');
    const amount = `${escapeHtml(service.currency || '')} ${Number(service.price || 0).toLocaleString()}`;
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee5d8;">
        <div style="font-weight:700;color:#201c18;">${name}</div>
        <div style="font-size:13px;color:#74695d;">${packageName}</div>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #eee5d8;font-weight:700;color:#201c18;">${amount}</td>
    </tr>`;
  }).join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}</table>`;
}

export function buildOtpEmail({ otp, purpose = 'verification', expiresInMinutes = 10 }) {
  const safePurpose = escapeHtml(purpose);
  const html = renderLayout({
    preheader: `Your ${BRAND_NAME} verification code is ${otp}.`,
    title: 'Your Verification Code',
    intro: `Use this code to complete your ${safePurpose}.`,
    body: `<div style="background:#f8f1df;border:1px solid #ead8aa;border-radius:12px;padding:18px;text-align:center;">
      <div style="font-size:34px;letter-spacing:8px;font-weight:800;color:#111111;">${escapeHtml(otp)}</div>
      <div style="margin-top:8px;font-size:13px;color:#74695d;">This code expires in ${Number(expiresInMinutes)} minutes.</div>
    </div>`,
    footer: 'If you did not request this code, you can safely ignore this email.',
  });

  return {
    subject: `${BRAND_NAME} verification code`,
    text: `Your ${BRAND_NAME} verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    html,
  };
}

export function buildBookingConfirmationEmail({ booking }) {
  const name = booking?.user_name ? escapeHtml(booking.user_name) : 'there';
  const html = renderLayout({
    preheader: 'Your booking request has been received.',
    title: 'Booking Request Received',
    intro: `Hi ${name}, thanks for booking with us. We have received your request and our team will follow up shortly.`,
    body: `<div style="background:#fbf9f5;border:1px solid #eee5d8;border-radius:12px;padding:16px;">
      <div style="font-size:13px;color:#74695d;margin-bottom:8px;">Booking reference</div>
      <div style="font-size:18px;font-weight:800;color:#201c18;">${escapeHtml(String(booking?.id || '').slice(0, 8).toUpperCase())}</div>
      ${renderServiceList(booking?.selected_services)}
    </div>`,
    footer: 'You can return to your booking dashboard using the verification flow on our website.',
  });

  return {
    subject: `${BRAND_NAME} booking confirmation`,
    text: `Your booking request has been received. Reference: ${String(booking?.id || '').slice(0, 8).toUpperCase()}`,
    html,
  };
}

const PAYMENT_METHOD_LABELS = {
  paystack: 'Paystack Online Payment',
  cash: 'In-Person Cash',
  bank_transfer: 'Bank Transfer',
  momo_merchant: 'Merchant MoMo',
};

function renderPaymentInstructions({ paymentRequest, invoice, dashboardUrl }) {
  const method = paymentRequest?.payment_method || invoice?.payment_method || 'paystack';
  const details = invoice?.payment_details && typeof invoice.payment_details === 'object' ? invoice.payment_details : {};
  const instructions = paymentRequest?.offline_instructions || details.offline_instructions || '';

  if (method === 'bank_transfer') {
    return `<div style="background:#fbf9f5;border:1px solid #eee5d8;border-radius:12px;padding:16px;margin-top:16px;">
      <div style="font-weight:800;color:#201c18;margin-bottom:10px;">Bank transfer details</div>
      ${details.bank_name ? `<p style="margin:0 0 6px;"><strong>Bank:</strong> ${escapeHtml(details.bank_name)}</p>` : ''}
      ${details.bank_account_name ? `<p style="margin:0 0 6px;"><strong>Account name:</strong> ${escapeHtml(details.bank_account_name)}</p>` : ''}
      ${details.bank_account_number ? `<p style="margin:0 0 6px;"><strong>Account number:</strong> ${escapeHtml(details.bank_account_number)}</p>` : ''}
      ${instructions ? `<p style="margin:10px 0 0;color:#74695d;">${escapeHtml(instructions)}</p>` : ''}
    </div>`;
  }

  if (method === 'momo_merchant') {
    return `<div style="background:#fbf9f5;border:1px solid #eee5d8;border-radius:12px;padding:16px;margin-top:16px;">
      <div style="font-weight:800;color:#201c18;margin-bottom:10px;">Merchant MoMo details</div>
      ${details.merchant_momo_name ? `<p style="margin:0 0 6px;"><strong>Merchant name:</strong> ${escapeHtml(details.merchant_momo_name)}</p>` : ''}
      ${details.merchant_momo_number ? `<p style="margin:0 0 6px;"><strong>Merchant number:</strong> ${escapeHtml(details.merchant_momo_number)}</p>` : ''}
      ${instructions ? `<p style="margin:10px 0 0;color:#74695d;">${escapeHtml(instructions)}</p>` : ''}
    </div>`;
  }

  if (method === 'cash') {
    return `<div style="background:#fbf9f5;border:1px solid #eee5d8;border-radius:12px;padding:16px;margin-top:16px;">
      <div style="font-weight:800;color:#201c18;margin-bottom:10px;">Cash payment</div>
      <p style="margin:0;">Please make payment in person to Stay Jazzy Multimedia or an authorized team member.</p>
      ${instructions ? `<p style="margin:10px 0 0;color:#74695d;">${escapeHtml(instructions)}</p>` : ''}
    </div>`;
  }

  return `<div style="margin-top:18px;text-align:center;">
    <a href="${escapeHtml(dashboardUrl || '#')}" style="display:inline-block;background:#650029;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:800;">Open Booking Dashboard to Pay</a>
  </div>`;
}

export function buildPaymentRequestEmail({ booking, paymentRequest, invoice, dashboardUrl }) {
  const name = booking?.user_name ? escapeHtml(booking.user_name) : 'there';
  const amount = Number(paymentRequest?.amount || invoice?.total || 0);
  const currency = paymentRequest?.currency || invoice?.currency || 'GHS';
  const method = paymentRequest?.payment_method || invoice?.payment_method || 'paystack';
  const methodLabel = PAYMENT_METHOD_LABELS[method] || 'Payment';
  const details = invoice?.payment_details && typeof invoice.payment_details === 'object' ? invoice.payment_details : {};
  const bookingRef = String(booking?.id || invoice?.booking_id || paymentRequest?.booking_id || '').slice(0, 8).toUpperCase();
  const invoiceRef = invoice?.invoice_number || String(invoice?.id || '').slice(0, 8).toUpperCase();

  const html = renderLayout({
    preheader: `New invoice payment request: ${currency} ${amount.toLocaleString()}.`,
    title: 'Invoice Payment Request',
    intro: `Hi ${name}, an invoice has been generated for your Stay Jazzy Multimedia booking.`,
    body: `<div style="background:#f8f1df;border:1px solid #ead8aa;border-radius:12px;padding:18px;">
      <p style="margin:0 0 8px;color:#74695d;font-size:13px;">Booking reference</p>
      <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#201c18;">${escapeHtml(bookingRef)}</p>
      ${invoiceRef ? `<p style="margin:0 0 8px;color:#74695d;font-size:13px;">Invoice</p><p style="margin:0 0 14px;font-weight:700;color:#201c18;">${escapeHtml(invoiceRef)}</p>` : ''}
      <p style="margin:0 0 8px;color:#74695d;font-size:13px;">Project stage</p>
      <p style="margin:0 0 14px;font-weight:700;color:#201c18;">${escapeHtml(paymentRequest?.stage_name || 'Payment request')}</p>
      <p style="margin:0 0 8px;color:#74695d;font-size:13px;">Amount due</p>
      <p style="margin:0 0 14px;font-size:24px;font-weight:900;color:#650029;">${escapeHtml(currency)} ${amount.toLocaleString()}</p>
      <p style="margin:0;color:#74695d;font-size:13px;">Payment mode</p>
      <p style="margin:4px 0 0;font-weight:700;color:#201c18;">${escapeHtml(methodLabel)}</p>
    </div>
    ${renderPaymentInstructions({ paymentRequest, invoice, dashboardUrl })}`,
    footer: method === 'paystack'
      ? 'Use your booking dashboard to complete online payment securely.'
      : 'After making payment, our admin team will confirm and update your booking payment status.',
  });

  const text = [
    `Invoice payment request from ${BRAND_NAME}`,
    `Booking: ${bookingRef}`,
    invoiceRef ? `Invoice: ${invoiceRef}` : '',
    `Stage: ${paymentRequest?.stage_name || 'Payment request'}`,
    `Amount due: ${currency} ${amount.toLocaleString()}`,
    `Payment mode: ${methodLabel}`,
    dashboardUrl && method === 'paystack' ? `Pay online: ${dashboardUrl}` : '',
    method === 'bank_transfer' && details.bank_name ? `Bank: ${details.bank_name}` : '',
    method === 'bank_transfer' && details.bank_account_name ? `Account name: ${details.bank_account_name}` : '',
    method === 'bank_transfer' && details.bank_account_number ? `Account number: ${details.bank_account_number}` : '',
    method === 'momo_merchant' && details.merchant_momo_name ? `Merchant name: ${details.merchant_momo_name}` : '',
    method === 'momo_merchant' && details.merchant_momo_number ? `Merchant number: ${details.merchant_momo_number}` : '',
    paymentRequest?.offline_instructions ? `Instructions: ${paymentRequest.offline_instructions}` : '',
  ].filter(Boolean).join('\n');

  return {
    subject: `${BRAND_NAME} invoice payment request`,
    text,
    html,
  };
}

export function buildContactMessageEmail({ message }) {
  const html = renderLayout({
    preheader: `New contact message from ${message?.name || 'website visitor'}.`,
    title: 'New Contact Message',
    intro: `A new message was submitted from ${escapeHtml(message?.name || 'the website')}.`,
    body: `<div style="background:#fbf9f5;border:1px solid #eee5d8;border-radius:12px;padding:16px;line-height:1.6;">
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(message?.email || '')}</p>
      <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(message?.phone || 'N/A')}</p>
      <p style="margin:0;"><strong>Message:</strong><br>${escapeHtml(message?.message || '').replaceAll('\n', '<br>')}</p>
    </div>`,
    footer: 'Reply directly to the customer from your admin workflow.',
  });

  return {
    subject: `New contact message from ${message?.name || 'website visitor'}`,
    text: `New contact message from ${message?.name || 'website visitor'}\nEmail: ${message?.email || ''}\n\n${message?.message || ''}`,
    html,
  };
}

export async function sendEmail({ to, subject, text, html, replyTo }) {
  if (!to || !subject || (!text && !html)) {
    const error = new Error('Missing required email fields');
    error.code = 'INVALID_EMAIL_PAYLOAD';
    throw error;
  }

  const config = assertEmailConfigured();
  const transporter = createTransporter();
  return transporter.sendMail({
    from: getFromAddress(config),
    to,
    subject,
    text,
    html,
    replyTo,
  });
}
