# Administrator guide

In development, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before running the seed command, then sign in at `/admin`. The current staff surface displays database-backed counts for sessions, pending payments, customers and confirmed collections for the current day.

Packages and the initial site are seeded from `apps/api/prisma/seed.ts`. Package editing, router registration workflows, customer search, exports, refunds, site management, role administration and support ticket UI are not implemented yet. Do not treat the dashboard as a full network operations console.
