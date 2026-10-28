# Operations runbook

For local development, inspect `docker compose ps`, API health endpoints and application logs. Back up PostgreSQL with `pg_dump` and test restoring into an isolated database. Review pending payment orders and outbox retries; compare confirmed receipts with Daraja reports.

Before any real customer launch, establish on-call ownership, TLS and provider credential rotation, incident escalation, privacy retention, alert thresholds, backup RPO/RTO, a tested rollback plan and a security response process. Router outages cannot currently be detected by the app.
