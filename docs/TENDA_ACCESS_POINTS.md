# Tenda access points

Tenda device capabilities vary by model and firmware; the application does not manage Tenda devices. For a centrally enforced ISP network, prefer access-point/bridge mode with the MikroTik gateway responsible for routing, DHCP, policy and HotSpot/RADIUS. Avoid a second DHCP server or double NAT unless the topology specifically requires it.

Validate wired/wireless backhaul, client isolation, guest network/VLAN support, roaming behavior and whether clients can share/tether connectivity. Test with Android, iOS and laptops, including randomized MAC addresses. Use the vendor manual for the exact model and firmware; do not assume a generic Tenda management API exists.
