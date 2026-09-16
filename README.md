<div align="center">

```
  ███████╗███████╗███╗   ███╗██╗   ██╗██╗  ██╗
  ╚══██╔══╝██╔════╝████╗ ████║██║   ██║██║ ██╔╝
     ██║   █████╗  ██╔████╔██║██║   ██║█████╔╝
     ██║   ██╔══╝  ██║╚██╔╝██║╚██╗ ██╔╝██╔═██╗
     ██║   ███████╗██║ ╚═╝ ██║ ╚████╔╝ ██║  ██╗
     ╚═╝   ╚══════╝╚═╝     ╚═╝  ╚═══╝  ╚═╝  ╚═╝
```

# @zerohack/ctf-lab · `zh-lab`

**Automated protocol CTF lab runner — http, ssh, tcp, udp, dns, tls scenarios**

[![License](https://img.shields.io/badge/license-Apache--2.0-00B0BD?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![Zero Budget](https://img.shields.io/badge/cost-%240-00b894?style=for-the-badge)](https://zerohack.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00B0BD?style=for-the-badge)](CONTRIBUTING.md)

**Part of the [ZeroHack](https://zerohack.org) Geek Tools ecosystem**
Category: `lab` · `ctf` · `docker` · `protocols` · `academy`

</div>

---

> **⚡ Zero Budget. Zero Cloud Dependencies. Pure Local Power.**

---

## What It Does

The Academy's automated protocol-lab: a catalog of containerized protocol CTFs
(http, ssh, tcp, udp, dns, tls). Everything here is **pure code** — scenario
lookup, container planning, ready-state reports and flag minting run without
any docker engine or network access.

---

## Quick Start

```bash
# From the monorepo root
git clone https://github.com/ZeroHackOrg/zerohack-geek-tools.git
cd zerohack-geek-tools && npm install
npm run geek:lab -- scenario showcase
```

**Standalone:**

```bash
git clone https://github.com/ZeroHackOrg/zerohack-ctf-lab.git
cd zerohack-ctf-lab && npm install
npx tsx src/bin.ts plan dns-exfil
```

### Standalone Resolution

```bash
git clone https://github.com/ZeroHackOrg/zerohack-shared.git
cd zerohack-shared && npm install && npm link
cd ../zerohack-ctf-lab && npm link @zerohack/shared
```

---

## Commands

| Command | Description |
|---|---|
| `zh-lab list [--json]` | List all scenarios |
| `zh-lab scenario <id> [--json]` | Case-insensitive, suffix-tolerant id lookup |
| `zh-lab plan <id> [--json]` | Deterministic `ContainerPlan` table + docker run hints |
| `zh-lab report <id> [--json]` | Ready `LabReport` with endpoints |
| `zh-lab flag <id> [--set VALUE]` | Mint a flag or validate a submission |

**Examples:**

```bash
zh-lab scenario showcase
zh-lab plan dns-exfil
zh-lab report tcp-flag-cookie
zh-lab flag http-xss-showcase
zh-lab flag ssh-banner-grab --set 'zhctf{my_answer_here}'
```

---

## Modules

- `SCENARIOS` — embedded `LabScenario[]` catalog (shared types), one scenario
  per protocol with difficulty, learningPath, tags, flagEnv, flagPattern and
  per-service health checks.
- `scenario(id)` / `list()` — case-insensitive, suffix-tolerant lookup and a
  sorted catalog.
- `buildPlan(scenarioId)` — one `ContainerPlan` per service with deterministic
  names `zh-<scenario>-<idx>`, a `zhnet-<scenario>` network, injected
  `SCENARIO_ID` / `FLAG_ENV`, and `portBindings` skipped when `exposePort` is 0.
- `createReport(scenarioId, portFor?)` — a `status: "ready"` `LabReport` with
  `http://localhost:<port>` or `tcp://localhost:<port>` endpoints; `portFor`
  pins dynamic ports so tests stay deterministic.
- `generateFlag(scenario)` / `validateFlag(value)` — mint with `randomFlag`
  (honoring `flagEnv`) or verify against `looksLikeFlag`.

---

## Design Notes

- `buildPlan` performs zero docker calls; the CLI's `plan` command only prints
  ready-to-run `docker run` hints.
- No environment variables are used, so there is no `.env.example`.

---

## Tests

```bash
npm run typecheck --workspace @zerohack/ctf-lab
npm run test    --workspace @zerohack/ctf-lab
```

---

## Architecture

```
zerohack-ctf-lab/
├── src/
│   ├── bin.ts          # CLI entrypoint (commander)
│   ├── index.ts        # Re-exports
│   ├── scenarios.ts    # SCENARIOS catalog (one per protocol)
│   ├── plan.ts         # buildPlan — deterministic ContainerPlan
│   ├── report.ts       # createReport — ready LabReport
│   └── flag.ts         # generateFlag / validateFlag
├── test/
│   └── lab.test.ts     # Unit tests (vitest)
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE             # Apache-2.0
├── SECURITY.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

**Design principles:**
- No docker calls in the core — planning/reporting are pure.
- Deterministic container names, networks, flag env.
- Zero runtime dependencies beyond `@zerohack/shared` (dockerode optional).

---

## Security

Everything is pure planning/rendering code — it never launches containers by
itself. You choose what `docker run` hints to execute. Flags are lab-only.

For vulnerability reports, see [SECURITY.md](SECURITY.md).

---

## Related Packages

| Package | Binary | What It Does |
|---|---|---|
| [@zerohack/shared](../zerohack-shared) | — | Types, schemas, catalog |
| [@zerohack/ctf-automation](../zerohack-ctf-automation) | `zh-ctf` | CTF solver |
| [@zerohack/cli](../zerohack-cli) | `zh` | Unified CLI |
| [@zerohack/pal](../zerohack-pal) | `zh-pal` | Local AI assistant |
| [@zerohack/recon-bot](../zerohack-recon-bot) | `zh-recon` | Passive recon |
| [@zerohack/honeypot](../zerohack-honeypot) | `zh-honeypot` | Honeypot |
| [@zerohack/secret-scanner](../zerohack-secret-scanner) | `zh-secret` | Secret scanner |
| [@zerohack/log-analyzer](../zerohack-log-analyzer) | `zh-log` | Log forensics |
| [@zerohack/supalite-api](../zerohack-supalite-api) | `zh-api` | PostgREST API |
| [@zerohack/ssh-hardener](../zerohack-ssh-hardener) | `zh-ssh` | SSH auditor |
| [@zerohack/osint-cli](../zerohack-osint-cli) | `zh-osint` | OSINT tools |

---

## Community

- **Issues:** [GitHub Issues](https://github.com/ZeroHackOrg/zerohack-ctf-lab/issues)
- **PRs:** [Pull Requests](https://github.com/ZeroHackOrg/zerohack-ctf-lab/pulls)
- **Security:** [SECURITY.md](SECURITY.md)
- **Platform:** [zerohack.org](https://zerohack.org)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Read our [Code of Conduct](CODE_OF_CONDUCT.md) first.

## License

[Apache-2.0](LICENSE) — Copyright 2026 ZeroHack Security