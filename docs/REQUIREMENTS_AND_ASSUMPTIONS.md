# Requirements and assumptions

Implemented in this starting codebase: tenant-aware relational schema; initial HiveNet tenant/site/package seed; public package listing; staff password verification with Argon2 and signed JWT; staff overview counts; Kenyan number normalization; Daraja STK Push and status query; persisted callback + outbox; idempotent entitlement creation after provider query; responsive customer purchase UI.

Not implemented: complete platform-owner and tenant admin workflows, RLS or proven tenant isolation, MFA, session revocation, customer account/dashboard/recovery codes, access-code hashing, router credential encryption, MikroTik and RADIUS adapters, actual network authorization, SMS, support workflow, package CRUD, refunds, financial exports, expiry/revocation workers, production Dockerfiles/reverse proxy, monitoring, full test suite and load tests.

Assumptions: money is represented in minor units (100 per KES); initial package expiry begins when provider-confirmed payment is processed; tenant slug `hivenet` is the development tenant; packages use site-specific catalog entries; one customer record is identified by normalized phone within a tenant. Production requirements such as regulatory retention, payment reversal policy, supported RouterOS models, provider contract and device policy require operator decisions.
