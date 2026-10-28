# Installation

## Local development

Install Node.js 20.19 or newer, npm 10+, and Docker Desktop with Compose. From the repository root:

1. Copy `.env.example` to `.env`; replace the JWT secret and set seed administrator credentials.
2. Run `docker compose up -d` to start PostgreSQL and Redis.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate` to apply the committed initial migration and any later migrations.
6. Run `npm run db:seed`.
7. Run `npm run dev`; browse to `http://localhost:3000`.

The API listens on port 4000, the frontend on port 3000. `GET /api/health` is liveness; `GET /api/health/ready` checks PostgreSQL readiness. The Redis container is currently reserved for future worker queues.

## M-Pesa sandbox

Fill the sandbox consumer key, secret, shortcode, passkey and a publicly reachable HTTPS callback URL. A local callback URL requires a secure tunnel. Daraja will not send callbacks to localhost. Do not test with real customer funds during local development.

## Migration practice

For local schema changes, run `npm run db:migrate -w @hivenet/api -- --name <change>` and commit the generated Prisma migration SQL. Deployment must use `npm run db:deploy`; never run `migrate dev` against production.
