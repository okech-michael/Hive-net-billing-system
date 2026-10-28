# MikroTik integration setup

## Current limitation

This version stores router inventory fields in the Prisma schema but does **not** implement RouterOS commands, credential encryption, health checks, session authorization, disconnect, reconciliation, or RADIUS. Successful payment therefore remains `PENDING_NETWORK`. Do not connect this application to a production router or promise automatic access.

## Safe future commissioning

1. Confirm the exact model and RouterOS version. Back up the current router configuration and arrange an out-of-band recovery path before any network change.
2. Plan separate client and management networks. Keep router administration off customer VLANs and the public internet; use a VPN or private management network and firewall allowlists.
3. Test RouterOS HotSpot/RADIUS behavior on a spare router or isolated site. Verify DHCP, DNS, captive detection, client isolation, expiry and rate profiles with test devices.
4. Create a least-privilege API account only after the adapter's required commands and permissions have been reviewed. Prefer API-SSL with certificate validation over plaintext API.
5. Register inventory and credentials only after encrypted secret storage is implemented and independently reviewed.
6. Stage a single test client, verify authorization and revocation, monitor logs and retain the rollback configuration.

Do not paste generic firewall scripts into a live router. RouterOS command syntax and capabilities vary by version and model; follow current MikroTik documentation for your exact device.
