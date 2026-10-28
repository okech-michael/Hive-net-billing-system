# Testing

Run `npm test` for API unit tests (currently Kenyan phone normalization). Run `npm run build` for TypeScript and production frontend builds. To validate persistence, start Compose, apply migrations and seed the local database.

The M-Pesa boundary requires Daraja sandbox credentials and a reachable callback endpoint. No live-payment, RouterOS hardware, RADIUS, SMS, end-to-end browser, load, resilience or tenant-isolation suite is currently included or claimed as passing. Add those acceptance tests before production.
