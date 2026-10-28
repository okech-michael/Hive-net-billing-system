# M-Pesa Daraja

The backend sends STK Push through Safaricom's Daraja OAuth and `mpesa/stkpush/v1/processrequest` endpoints, then uses `mpesa/stkpushquery/v1/query` during callback reconciliation. Configure a Daraja app and business shortcode/passkey with Safaricom; use sandbox credentials first.

Set `MPESA_ENV=sandbox`, consumer key/secret, shortcode, passkey and `MPESA_CALLBACK_URL`. The callback must be reachable over HTTPS. Public access must be routed to `POST /api/payments/mpesa/callback`. Do not use a browser redirect as a payment signal or ever ask for a customer's PIN.

Callback payload is stored before acknowledging it. Duplicate callback delivery is idempotent. The API queries Daraja and compares provider result with order, amount, phone and receipt before entitlement issuance. Check API logs, callback rows, payment orders and outbox attempts when status is delayed. Reconcile collections against Daraja business statements before accounting close.

The callback does not have a general webhook signature in this integration. Provider status query is required but is not a substitute for operational reconciliation or transport security. Refund/reversal operations are not implemented. Test callback paths and transaction query against sandbox before live onboarding.
