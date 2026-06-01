<h1 align="center">OZON</h1>

<!-- Logo -->
<p align="center">
  <img
    src="https://i.ibb.co/wFF9V6xT/file-00000000d59871fa8923a436b7206286.png"
    width="180"
    alt="OZON Logo"
  />
</p>

<p align="center">
  An open source security protocol for VPS servers and static sites.<br/>
  Built by DSwebTEAM · MIT License
</p>
<p align="center">
  An open source security protocol for VPS servers and static sites.<br/>
  Built by DSwebTEAM · MIT License
</p>

<p align="center">
  An open source security protocol for VPS servers and static sites.<br/>
  Built by <a href="https://github.com/DSwebTEAM">DSwebTEAM</a> · MIT License
</p>

---

## What it is

OZON is a security protocol that covers two separate problems:

1. **Admin Face** — hardening the channel between an operator and their server
2. **Edge Face** — protecting credential delivery between a hosted site and the end-user browser

The name comes from the ozone layer. UV = Unauthorised Visitors.

---

## Status

> **Early development.** The protocol specification and documentation site are complete. The installer and CLI are in progress.

---

## Admin Face

Five hardening layers applied progressively based on the selected preset.

| Layer | What it does |
|-------|-------------|
| L1 | SSH moved to a random port (10000–65535) |
| L2 | fail2ban with aggressive rate limits |
| L3 | Ed25519 keypair + mTLS between internal services |
| L4 | WireGuard tunnel — SSH runs inside it |
| L5 | Port 443 masquerade + ghost mode daemon |

---

## Edge Face

Runs as a Cloudflare Worker between your static site and all outbound API/database calls. No server required.

- API keys stay in Worker environment variables — never reach the browser
- DB connection URL is never exposed to the frontend
- App-layer encryption on tokens and JWTs on top of standard TLS
- Request signing — only the Worker can call your API

---

## Presets

| Tier | Name | Scope |
|------|------|-------|
| 01 | Sentinel | VPS + Static |
| 02 | Aegis | VPS + Static |
| 03 | Blacksite | VPS + Static |
| 04 | Sovereign | VPS only — DSwebTEAM certified |

Each tier is additive. Sovereign includes all layers from all previous tiers.

---

## Installation

```bash
curl -fsSL https://get.ozon.is-a.dev | bash
```

Or manually:

```bash
git clone https://github.com/DSwebTEAM/Ozon
cd Ozon
sudo bash install.sh
```

**Supported systems:** Debian 11/12, Ubuntu 20.04/22.04/24.04, any systemd-based Linux distro. Root or sudo access required.

---

## CLI

```bash
ozon status           # show active layers
ozon audit            # run a full security check
ozon preset upgrade   # move to the next preset tier
ozon harden           # apply additional hardening within current tier
ozon edge deploy      # redeploy the Edge Face Worker
ozon logs             # view activity and audit trail
ozon rotate-keys      # regenerate the device Ed25519 keypair
```

---

## Attestation

Every installation generates a hardware-bound Ed25519 keypair from the machine's CPU serial, MAC address, and install timestamp. The signature is injected into every HTTP response:

```
X-Powered-By:       DSwebTEAM-OZON-v1.0
X-Ozon-Fingerprint: sha256(cpu + mac + timestamp)
X-Ozon-Attestation: ed25519_sign(fingerprint)
X-Ozon-PublicKey:   base64(ed25519_pubkey)
```

Verification is fully decentralised — no central registry or API call required.

---

## Documentation

Full documentation and architecture reference at [ozon.is-a.dev](https://ozon.is-a.dev) *(pending DNS propagation — currently at [ozon-2dk.pages.dev](https://ozon-2dk.pages.dev))*.

---

## Project structure

```
Ozon/
├── install.sh          # main installer
├── src/
│   ├── presets/        # Sentinel, Aegis, Blacksite, Sovereign configs
│   ├── edge/           # Edge Face Worker source
│   └── cli/            # ozon CLI
├── docs/               # protocol specification
└── site/               # documentation site (Vite + React)
```

---

## License

MIT — see [LICENSE](LICENSE)

---
<p align="center">
  <a href="https://github.com/DSwebTEAM">
    <img
      src="https://i.ibb.co/Jh1hqx7/ds-logo.png"
      width="40"
      alt="DSwebTEAM"
    />
  </a>
</p>

<p align="center">
  Built and maintained by<br/>
  <a href="https://github.com/DSwebTEAM"><strong>DSwebTEAM</strong></a>
</p>
