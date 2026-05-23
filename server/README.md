# Stay Jazzy Multimedia — Backend API Server

A lightweight Node.js/Express server that handles all third-party API calls (SMS and Paystack) on behalf of the React frontend.

## Requirements
- Node.js 18+

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your actual keys

# 3. Start the server
npm start         # production
npm run dev       # development (auto-restarts on file changes)
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4000) |
| `ALLOWED_ORIGIN` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `SMS_API` | cSMS Bearer token (`csms_...`) |
| `SENDER_ID` | Approved alphanumeric sender ID (e.g. `DELIVERYHUB`) |
| `ADMIN_ALERT_PHONE` | Phone number to SMS when the chat bot has no answer |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_...` or `sk_live_...`) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (also goes in frontend `.env`) |

## API Endpoints

### Health
- `GET /api/health` — server status check

### SMS (`/api/sms`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/sms/send` | Send SMS to one or more phone numbers |
| POST | `/api/sms/chat-alert` | Alert admin when chat bot has no answer |

### Paystack (`/api/paystack`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/paystack/initialize` | Create a new transaction |
| GET | `/api/paystack/verify/:reference` | Verify a completed transaction |
| GET | `/api/paystack/transaction/:id` | Fetch single transaction |
| GET | `/api/paystack/transactions` | List transactions |

## SMS Provider
Uses [cSMS](https://app.mycsms.com) — Ghanaian SMS gateway.  
Phone numbers are automatically normalised (e.g. `0241234567` → `233241234567`).

## Paystack
All sensitive Paystack calls (initialise, verify) go through this server so the secret key is never exposed to the browser.
