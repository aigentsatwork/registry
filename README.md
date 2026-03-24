<div align="center">

<!-- Replace with your actual pwa.mobi logo URL once uploaded to the repo -->
<img src="https://raw.githubusercontent.com/pwamobi/registry/main/assets/pwamobi-logo.png" alt="pwa.mobi" height="72" />

<h1>pwa.mobi Registry</h1>

<p><strong>The official registry of verified Progressive Web Apps listed on <a href="https://pwa.mobi">pwa.mobi</a></strong></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE-MIT)
[![Registry: CC0](https://img.shields.io/badge/Registry-CC0-brightgreen.svg)](LICENSE)
[![Submissions: Open](https://img.shields.io/badge/Submissions-Open-blue.svg)](SUBMISSION_GUIDE.md)
[![Audit: Automated](https://img.shields.io/badge/Audit-Automated-blue.svg)](.github/workflows/audit.yml)
[![Discord](https://img.shields.io/badge/Community-Discord-5865F2.svg)](https://discord.gg/YOUR_INVITE)

</div>

---

## The Vision

The web was always the greatest open platform ever built. No gatekeepers. No permission required. Anyone with a domain and an idea could reach the world.

Then app stores arrived — and slowly, quietly, they became toll booths.

**30% of every transaction.** Weeks of opaque review processes. Policies that change overnight. The power to remove your business with a single email. Developers lost control of their distribution, their revenue, and their relationship with their users.

**pwa.mobi exists to change that.**

Progressive Web Apps have matured to the point where the gap between a PWA and a native app is narrower than most people realize. Offline support, push notifications, camera access, payments, near-native performance — it's all there, built on open web standards, accessible from a URL.

This registry is the trust layer that makes it real. A community-verified directory where developers list their PWAs freely, users discover apps they can trust, and nobody takes a cut of anyone's revenue.

> *The web is the platform. It always was.*

---

## What This Registry Is

This repository is the **single source of truth** for all PWAs listed in the pwa.mobi directory.

- ✅ **Fully open source** — every listing, every audit result, publicly auditable
- ✅ **Submission by Pull Request** — transparent, community-reviewable process
- ✅ **Automated audit pipeline** — GitHub Actions runs checks on every submission
- ✅ **Human reviewed** — a maintainer reviews every passing audit before merge
- ✅ **Zero fees** — free to list, free forever, we take nothing
- ✅ **No binaries hosted** — we index URLs, developers own and host everything

---

## How It Works

```
Developer forks repo → adds YAML file → opens Pull Request
                                              ↓
                              GitHub Actions runs automated audit
                              (HTTPS · Manifest · Service Worker ·
                               Lighthouse · Security Headers ·
                               Safe Browsing · Schema validation)
                                              ↓
                              ┌──────────────────────────────┐
                              │  Pass → labeled audit-passed  │
                              │  Fail → bot comments issues   │
                              └──────────────────────────────┘
                                              ↓
                              Maintainer reviews → merges PR
                                              ↓
                              registry.json auto-rebuilds
                                              ↓
                              App appears live on pwa.mobi/directory
```

---

## Audit Criteria

Every submitted PWA is automatically checked for:

| Check | Requirement |
|---|---|
| 🔒 HTTPS | Valid certificate, accessible URL |
| 📄 Web App Manifest | Present, valid, has `name` / `icons` / `start_url` / `display` |
| ⚙️ Service Worker | Registered and active |
| 📊 Lighthouse PWA Score | 85 or above |
| 🖼️ Icon | 512×512px icon present and loading |
| 🛡️ Security Headers | Content-Security-Policy header present |
| 🔍 Domain Reputation | Clean against Google Safe Browsing |
| ✅ YAML Schema | Submission file matches registry schema |

---

## Trust Tiers

| Badge | Meaning |
|---|---|
| ✅ **Verified** | Passed all automated checks + human review |
| 🔵 **Open Source** | Verified + source code is publicly available |

---

## Submit Your PWA

Read the **[Submission Guide](SUBMISSION_GUIDE.md)** for full instructions.

**Quick steps:**
1. Fork this repository
2. Copy [`apps/_template.yaml`](apps/_template.yaml) to `apps/your-app-name.yaml`
3. Fill in your app's details
4. Open a Pull Request
5. The audit bot runs automatically and reports results
6. Fix any issues, get the green check, get listed

**No fees. No approval committee. No 30% cut. Just a URL and a green check.**

---

## Repository Structure

```
registry/
├── README.md                       ← You are here
├── SUBMISSION_GUIDE.md             ← Full submission instructions
├── CODE_OF_CONDUCT.md              ← Community standards
├── package.json                    ← Node dependencies for audit tooling
├── apps/
│   ├── _template.yaml              ← Copy this to submit your PWA
│   └── *.yaml                      ← One file per listed PWA
├── schema/
│   └── app.schema.json             ← Strict validation schema
├── scripts/
│   ├── audit.js                    ← Automated audit brain
│   ├── validate-local.js           ← Local pre-check for developers
│   └── build-index.js              ← Generates registry.json on merge
├── assets/
│   └── pwamobi-logo.png            ← Project logo
├── registry.json                   ← Auto-generated app index (do not edit)
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md    ← Checklist shown on every PR
    └── workflows/
        ├── audit.yml               ← Runs on every PR touching apps/
        └── build-index.yml         ← Rebuilds registry.json on merge
```

---

## For Developers — Local Validation

Before opening a PR, validate your YAML file locally:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/registry.git
cd registry

# Install dependencies
npm install

# Validate your submission
npm run validate apps/your-app-name.yaml
```

This catches schema errors and basic issues before the CI pipeline runs.

Also check your Lighthouse PWA score at [web.dev/measure](https://web.dev/measure) — aim for 85+.

---

## Community

Join the pwa.mobi Discord to connect with other developers, get help with submissions, and shape the direction of the project.

[![Join Discord](https://img.shields.io/badge/Join%20us%20on-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/YOUR_INVITE)

---

## Contributing

We welcome contributions to the registry tooling, audit scripts, and documentation.

- **Submit a PWA** → follow the [Submission Guide](SUBMISSION_GUIDE.md)
- **Report a listed app** → open an issue with the `report-app` label
- **Improve the audit tooling** → open a PR against `scripts/`
- **Fix documentation** → PRs welcome

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## License

| Component | License |
|---|---|
| Registry metadata (`apps/*.yaml`, `registry.json`) | [CC0 1.0 Universal](LICENSE) — public domain |
| Audit tooling (`scripts/`, `.github/`) | [MIT](LICENSE-MIT) |
| pwa.mobi name, logo, and brand | © Simple Minds — all rights reserved |

---

<div align="center">

<br />

<img src="https://raw.githubusercontent.com/pwamobi/registry/main/assets/simpleMindsLogo.png"
     alt="Simple Minds" height="32" />

<br /><br />

**pwa.mobi is a [Simple Minds](https://simplemindscr.com) initiative**

*Building tools for the open web, one URL at a time.*

<br />

© 2026 Simple Minds · [pwa.mobi](https://pwa.mobi) · [Terms](https://pwa.mobi/terms.html) · [Privacy](https://pwa.mobi/privacy.html)

</div>
