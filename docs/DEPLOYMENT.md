# Deployment

Deployment is not production-ready. Compose currently provides development PostgreSQL and Redis only; application Dockerfiles, reverse proxy, TLS termination, worker separation, backups automation, metrics and alerting are not included.

For a production design, use private managed PostgreSQL, separate credentials, TLS ingress/WAF, an isolated management VPN, secret manager, restricted egress, database backups with restoration drills, rate limits and monitoring. Apply only committed Prisma migrations with `db:deploy`. Set the exact browser origin, rotate JWT and provider secrets, and use Daraja production credentials only after sandbox, callback, financial and security acceptance tests.
