# HiveNet

HiveNet is a tenant-aware ISP billing and Wi-Fi access platform. This repository contains a Next.js customer portal and operations sign-in, a NestJS API, a PostgreSQL/Prisma data model, local PostgreSQL and Redis services, an M-Pesa Daraja STK integration, and operator documentation.

> **Implementation status:** this is a working foundation, not a production-ready complete ISP platform. Payments can be initiated and callback events are durably reconciled with Daraja before entitlements are issued. Router/RADIUS authorization, account provisioning beyond seed, MFA, customer dashboard, refunds, SMS, support workflows, comprehensive RBAC/RLS, and hardware/provider acceptance remain to be implemented and tested. Network activation is intentionally left pending rather than reported as successful.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS and Lucide.
- NestJS 11 REST API with validation, Helmet and global throttling.
- PostgreSQL 16 and Prisma 6; Redis 7 is available for future durable queues.
- Daraja STK Push plus STK transaction query before confirming payments.

## Quick start

Prerequisites: Node.js 20.19+, npm 10+, and Docker Desktop/Compose.

1. Copy `.env.example` to `.env`. Set a long random `JWT_SECRET`, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, and configure Daraja sandbox values when testing payment requests. Never use the example passwords in a shared environment.
2. Start local persistence: `docker compose up -d`.
3. Install packages: `npm install`.
4. Generate the Prisma client: `npm run db:generate`.
5. Apply the committed database migration: `npm run db:migrate`.
6. Load the development tenant, site and package catalog: `npm run db:seed`.
7. Start API and web: `npm run dev`.
8. Open `http://localhost:3000`; operations sign-in is at `/admin`, API readiness is `/api/health/ready`.

The root `DATABASE_URL` is used by Prisma commands and the API. `WEB_ORIGIN` should match the frontend origin. For a live Daraja callback, expose the API through HTTPS and set `MPESA_CALLBACK_URL` to the public callback URL. Do not accept real payments before verifying provider settings and callback behavior in the Daraja portal.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run API and web development servers |
| `npm run build` | Build API and frontend |
| `npm test` | Run API unit tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create or apply local development migrations |
| `npm run db:deploy` | Apply committed migrations in deployment |
| `npm run db:seed` | Insert development tenant, site and packages |

The optional seed administrator is created only when both `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set.

## Repository

```text
apps/api/       NestJS API, Prisma schema, seed and tests
apps/web/       Next.js captive-portal-style package purchase UI and staff sign-in
docs/           Installation, architecture, integration and operations notes
docker-compose.yml  Local PostgreSQL and Redis
```

See [docs/INDEX.md](docs/INDEX.md) for documentation and [docs/REQUIREMENTS_AND_ASSUMPTIONS.md](docs/REQUIREMENTS_AND_ASSUMPTIONS.md) for implemented scope and operational boundaries.
