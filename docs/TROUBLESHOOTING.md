# Troubleshooting

| Symptom | Check | Action |
|---|---|---|
| API not ready | `GET /api/health/ready`, PostgreSQL status, `DATABASE_URL` | Start Compose services and verify database credentials |
| Package list empty | Seed command and API tenant slug | Run `npm run db:seed`; request uses tenant `hivenet` |
| Staff login fails | Seed admin environment and user row | Set both seed variables and re-run seed; check password length |
| STK request unavailable | Daraja env settings and API logs | Verify sandbox credentials, shortcode, passkey and provider reachability |
| Callback not received | Public HTTPS URL and ingress route | Confirm `/api/payments/mpesa/callback` is reachable from Safaricom |
| Payment stays pending | PaymentCallback and OutboxEvent rows; provider query | Check provider credentials and API logs; reconcile transaction through Daraja |
| Payment confirmed, no access | Entitlement status | Expected in this version: RouterOS activation is not implemented |

Never resolve payment issues by manually trusting a screenshot or browser redirect.
