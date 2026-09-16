/** Embedded catalog of protocol-lab scenarios for the Academy, plus lookup helpers. */

import { DEFAULT_FLAG_PATTERN, type LabScenario } from "@zerohack/shared";

export const FLAG_PATTERN_STRING = String(DEFAULT_FLAG_PATTERN);

export const SCENARIOS: LabScenario[] = [
  {
    id: "http-xss-showcase",
    name: "HTTP XSS Showcase",
    title: "XSS Showcase — steal the cookie",
    protocol: "http",
    difficulty: "easy",
    description:
      "A deliberately vulnerable comment form reflects untrusted input without encoding. Find the reflected payload, pivot to cookie theft, and submit the admin session flag.",
    learningPath: "HTTP → XSS → session fixation",
    tags: ["web", "xss", "http"],
    flagEnv: "HTTP_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 900,
    services: [
      {
        protocol: "http",
        image: "zhctf/http-xss:easy",
        internalPort: 80,
        exposePort: 8080,
        env: { HTTP_PORT: "80" },
        health: { kind: "http", port: 80, path: "/" },
      },
    ],
  },
  {
    id: "ssh-banner-grab",
    name: "SSH Banner Grab",
    title: "SSH Banner Grab — identify the running daemon",
    protocol: "ssh",
    difficulty: "medium",
    description:
      "A quietly modified OpenSSH banner leaks the real daemon version in a trailing comment. Connect, read the banner, and answer the version probe with a flag.",
    learningPath: "SSH → banner grabbing → version fingerprinting",
    tags: ["ssh", "recon", "banner"],
    flagEnv: "SSH_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 1200,
    services: [
      {
        protocol: "ssh",
        image: "zhctf/ssh-banner:medium",
        internalPort: 22,
        exposePort: 2222,
        env: { SSH_PORT: "22" },
        health: { kind: "tcp", port: 22 },
      },
    ],
  },
  {
    id: "tcp-flag-cookie",
    name: "TCP Flag Cookie",
    title: "Raw TCP — decode the flag cookie",
    protocol: "tcp",
    difficulty: "medium",
    description:
      "A raw TCP service speaks a tiny binary protocol: each client gets a cookie whose first bytes encode a flag chunk in the unused high nibbles. Read, decode, and reassemble.",
    learningPath: "TCP → byte-level protocol analysis → bit packing",
    tags: ["tcp", "binary", "protocol"],
    flagEnv: "TCP_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 1200,
    services: [
      {
        protocol: "tcp",
        image: "registry.zhctf.dev/lab/tcp-cookie:0.1.0",
        internalPort: 9001,
        exposePort: 0,
        env: { TCP_LISTEN: "9001" },
        health: { kind: "tcp", port: 9001 },
      },
    ],
  },
  {
    id: "udp-ping-pong",
    name: "UDP Ping-Pong",
    title: "UDP Ping-Pong — the echo that cheats",
    protocol: "udp",
    difficulty: "easy",
    description:
      "Every N-th UDP datagram is truncated by design. Interleave your own pings to reconstruct the full echo and read the flag split across responses.",
    learningPath: "UDP → stateless protocols → packet loss tricks",
    tags: ["udp", "networking", "protocol"],
    flagEnv: "UDP_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 600,
    services: [
      {
        protocol: "udp",
        image: "zhctf/udp-ping:latest",
        internalPort: 5300,
        exposePort: 0,
        env: { UDP_LISTEN: "5300" },
      },
    ],
  },
  {
    id: "dns-exfil",
    name: "DNS Exfil Tunnel",
    title: "DNS Exfil — follow the subdomain trail",
    protocol: "dns",
    difficulty: "hard",
    description:
      "A malware command channel hides flag bytes in query labels under a CnC domain. Resolve the authoritative zone, reconstruct the base32 labels, and wallow in the payload.",
    learningPath: "DNS → tunneling → base32 decoding",
    tags: ["dns", "tunneling", "forensics"],
    flagEnv: "DNS_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 1800,
    network: "zhnet-dns-exfil",
    services: [
      {
        protocol: "dns",
        image: "zhctf/dns-server:hard",
        internalPort: 53,
        exposePort: 5353,
        env: { DNS_PORT: "53" },
        health: { kind: "tcp", port: 53 },
      },
      {
        protocol: "dns",
        image: "zhctf/dns-logger:hard",
        internalPort: 53,
        exposePort: 0,
        env: { DNS_FORWARD: "dns-server:53" },
      },
    ],
  },
  {
    id: "tls-sni-discovery",
    name: "TLS SNI Discovery",
    title: "TLS SNI — enumerate the hidden vhosts",
    protocol: "tls",
    difficulty: "expert",
    description:
      "One listener, many certificates. The flag lives on a virtual host that only answers when the SNI extension names it. Probe the server-name space and find the hidden host.",
    learningPath: "TLS → SNI → certificate transparency",
    tags: ["tls", "ssl", "sni", "recon"],
    flagEnv: "TLS_FLAG",
    flagPattern: FLAG_PATTERN_STRING,
    timeoutS: 2400,
    services: [
      {
        protocol: "tls",
        image: "ghcr.io/zerohack/ctf/tls-sni:expert",
        internalPort: 443,
        exposePort: 8443,
        env: { TLS_PORT: "443", TLS_VHOST: "flag.lab.local" },
        health: { kind: "tcp", port: 443 },
      },
    ],
  },
];

/** Lookup helper — throws when a scenario id does not resolve. */
export function requireScenario(scenarioId: string): LabScenario {
  const s = scenario(scenarioId);
  if (!s) throw new Error(`Unknown scenario "${scenarioId}"`);
  return s;
}

/** Case-insensitive, suffix-tolerant scenario lookup. */
export function scenario(id: string): LabScenario | undefined {
  const q = String(id ?? "").trim().toLowerCase();
  if (!q) return undefined;
  const exact = SCENARIOS.find((s) => s.id === q);
  if (exact) return exact;
  const suffix = SCENARIOS.find((s) => s.id.endsWith(`-${q}`) || s.id.endsWith(q));
  if (suffix) return suffix;
  const prefix = SCENARIOS.find((s) => s.id.startsWith(q));
  if (prefix) return prefix;
  return SCENARIOS.find((s) => s.id.split("-").includes(q));
}

/** Catalog sorted by id for deterministic listing. */
export function list(): LabScenario[] {
  return [...SCENARIOS].sort((a, b) => a.id.localeCompare(b.id));
}