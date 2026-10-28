# Environment variables

Copy the placeholder values from `.env.example` to a private `.env`. Never commit `.env` or use development secrets in production.

| Variable | Secret? | Purpose |
|---|---:|---|
| `NODE_ENV` | No | Runtime mode |
| `API_PORT` | No | API listen port |
| `WEB_ORIGIN` | No | Allowed browser origin(s), comma-separated |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string (not yet used by application) |
| `JWT_SECRET` | Yes | Signs staff access tokens; use at least 32 random bytes |
| `ENCRYPTION_KEY` | Yes | Reserved for envelope encryption; router credential encryption is not yet implemented |
| `MPESA_ENV` | No | `sandbox` or `production` Daraja host |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | Yes | Daraja OAuth credentials |
| `MPESA_SHORTCODE`, `MPESA_PASSKEY` | Yes | Daraja business configuration |
| `MPESA_CALLBACK_URL` | No | Public HTTPS callback URL |
| `MPESA_ACCOUNT_REFERENCE`, `MPESA_TRANSACTION_DESC` | No | STK display text |
| `MIKROTIK_ENABLED`, `MIKROTIK_API_TIMEOUT_MS` | No | Reserved router integration settings; no adapter is active |
| `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` | Mixed | Reserved messaging configuration; no sender is active |
| `POSTGRES_PASSWORD` | Yes | Compose database password override |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Yes | Optional initial tenant admin; set only for controlled setup |

For production, use a managed secrets store and rotate credentials under an operator-approved change procedure. `ENCRYPTION_KEY` is currently unused; do not assume setting it encrypts database fields.
