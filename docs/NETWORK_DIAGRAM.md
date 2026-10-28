# Network diagram

```mermaid
flowchart LR
  Device[Customer phone / laptop] --> AP[Tenda AP, bridge/AP mode]
  AP --> GW[MikroTik gateway and HotSpot]
  GW --> WAN[Upstream ISP]
  GW -. planned private management link .-> API[HiveNet network adapter - not implemented]
  Device --> Portal[HiveNet captive portal]
  Portal --> API2[HiveNet API]
  API2 --> DB[(PostgreSQL)]
  API2 --> MPesa[Safaricom Daraja]
  MPesa -->|STK prompt to customer| Device
  MPesa -->|HTTPS callback| API2
```

This depicts the intended deployment, not an installed physical configuration. No RouterOS control plane is wired into the present code. See [MikroTik setup](MIKROTIK_SETUP.md) before planning hardware integration.
