# Security

The API uses Helmet, DTO validation, request throttling, Argon2 password verification and signed bearer tokens. Staff login is email/password; MFA, refresh/revocation sessions, CSRF protections for cookie sessions, full permission guards, password recovery, account lockout and comprehensive audit workflows are not implemented.

Payment PINs are never requested. Daraja secrets must stay server-side. The callback is persisted and checked against provider query before payment confirmation. HTTPS, callback reachability restrictions and regular financial reconciliation are required.

The tenant key is included in business records and queried in public package/payment flows. Database RLS and complete cross-tenant negative testing are absent. Do not onboard third-party ISP tenants or expose administrative APIs publicly until tenant authorization has been reviewed and completed.

Router credential encryption and a RouterOS adapter are not implemented. Do not store router passwords in the database. Keep API and database management endpoints on a private network, rotate credentials, minimize personal data, redact phone/MAC/IP values from logs and maintain tested off-site backups.

This is not a security certification. Perform threat modeling, dependency scanning, penetration testing, access review and incident-response exercises before production.
