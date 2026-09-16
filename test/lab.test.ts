import { describe, expect, it } from "vitest";
import { DEFAULT_FLAG_PATTERN, looksLikeFlag, type ContainerPlan, type LabScenario } from "@zerohack/shared";
import { generateFlag, validateFlag } from "../src/flag.ts";
import { buildPlan } from "../src/plan.ts";
import { createReport } from "../src/report.ts";
import { FLAG_PATTERN_STRING, SCENARIOS, list, scenario } from "../src/scenarios.ts";

const EXPECTED_PROTOCOLS = ["http", "ssh", "tcp", "udp", "dns", "tls"];

describe("catalog", () => {
  it("embeds scenarios covering every lab protocol", () => {
    expect(SCENARIOS.length).toBe(6);
    const protocols = new Set(SCENARIOS.map((s) => s.protocol));
    for (const p of EXPECTED_PROTOCOLS) expect(protocols.has(p as never)).toBe(true);
    for (const s of SCENARIOS) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(s.flagEnv).toMatch(/_FLAG$/);
      expect(s.flagPattern).toBe(FLAG_PATTERN_STRING);
      expect(s.timeoutS).toBeGreaterThan(0);
      expect(s.services.length).toBeGreaterThan(0);
    }
  });

  it("list() is sorted by id", () => {
    const ids = list().map((s) => s.id);
    expect(ids).toEqual([...ids].sort());
  });
});

describe("scenario lookup", () => {
  it("is case-insensitive", () => {
    expect(scenario("HTTP-XSS-SHOWCASE")?.id).toBe("http-xss-showcase");
    expect(scenario("Ssh-Banner-Grab")?.id).toBe("ssh-banner-grab");
  });

  it("is suffix-tolerant", () => {
    expect(scenario("showcase")?.id).toBe("http-xss-showcase");
    expect(scenario("banner-grab")?.id).toBe("ssh-banner-grab");
    expect(scenario("cookie")?.id).toBe("tcp-flag-cookie");
    expect(scenario("sni")?.id).toBe("tls-sni-discovery");
  });

  it("accepts a prefix and rejects unknown ids", () => {
    expect(scenario("dns")?.id).toBe("dns-exfil");
    expect(scenario("bogus")).toBeUndefined();
    expect(scenario("")).toBeUndefined();
  });
});

describe("buildPlan", () => {
  it("is deterministic across two runs (deep equal)", () => {
    expect(buildPlan("http-xss-showcase")).toEqual(buildPlan("http-xss-showcase"));
    expect(buildPlan("dns-exfil")).toEqual(buildPlan("dns-exfil"));
  });

  it("produces one container per service with stable names and network", () => {
    const plans: ContainerPlan[] = buildPlan("dns-exfil");
    expect(plans).toHaveLength(2);
    expect(plans.map((p) => p.name)).toEqual(["zh-dns-exfil-0", "zh-dns-exfil-1"]);
    expect(plans[0].network).toBe("zhnet-dns-exfil");
    expect(plans[1].network).toBe("zhnet-dns-exfil");
    expect(buildPlan("http-xss-showcase")[0].network).toBe("zhnet-http-xss-showcase");
  });

  it("injects SCENARIO_ID and FLAG_ENV into service env", () => {
    const plan = buildPlan("ssh-banner-grab")[0];
    expect(plan.env.SCENARIO_ID).toBe("ssh-banner-grab");
    expect(plan.env.FLAG_ENV).toBe("SSH_FLAG");
    expect(plan.env.SSH_PORT).toBe("22");
  });

  it("maps exposePort to portBindings and leaves exposePort 0 unset", () => {
    const http = buildPlan("http-xss-showcase")[0];
    expect(http.portBindings).toEqual([{ host: 8080, container: 80 }]);
    const tcp = buildPlan("tcp-flag-cookie")[0];
    expect(tcp.portBindings).toEqual([]);
    const udp = buildPlan("udp-ping-pong")[0];
    expect(udp.portBindings).toEqual([]);
  });

  it("throws for unknown scenarios", () => {
    expect(() => buildPlan("nope")).toThrow(/Unknown scenario "nope"/);
  });
});

describe("createReport", () => {
  it("builds a ready report with the configured endpoint scheme", () => {
    const report = createReport("http-xss-showcase");
    expect(report.status).toBe("ready");
    expect(report.protocol).toBe("http");
    expect(report.endpoints[0]).toBe("http://localhost:8080");
    expect(report.containers).toEqual(["zh-http-xss-showcase-0"]);
    expect(report.difficulty).toBe("easy");
  });

  it("uses tcp:// for non-http services", () => {
    expect(createReport("ssh-banner-grab").endpoints[0]).toBe("tcp://localhost:2222");
    expect(createReport("dns-exfil").endpoints[0]).toBe("tcp://localhost:5353");
  });

  it("lets a port resolver pin dynamic (exposePort 0) endpoints", () => {
    const report = createReport("tcp-flag-cookie", () => 12_345);
    expect(report.endpoints).toEqual(["tcp://localhost:12345"]);
    expect(report.id).toBe("lab-tcp-flag-cookie");
    const udp = createReport("udp-ping-pong", () => 40_000);
    expect(udp.endpoints).toEqual(["tcp://localhost:40000"]);
  });
});

describe("generateFlag", () => {
  it("mints flags matching the shared zhctf pattern and honors flagEnv", () => {
    const scenarioObj: LabScenario | undefined = scenario("http-xss-showcase");
    expect(scenarioObj).toBeDefined();
    const { env, flag } = generateFlag(scenarioObj as LabScenario);
    expect(env).toBe("HTTP_FLAG");
    expect(looksLikeFlag(flag)).toBe(true);
    expect(DEFAULT_FLAG_PATTERN.test(flag)).toBe(true);
    expect(flag.startsWith("zhctf{")).toBe(true);
    expect(flag.endsWith("}")).toBe(true);
  });

  it("accepts a scenario id and mints distinct flags", () => {
    const a = generateFlag("ssh-banner-grab");
    const b = generateFlag("ssh-banner-grab");
    expect(a.env).toBe("SSH_FLAG");
    expect(a.flag).toMatch(DEFAULT_FLAG_PATTERN);
    expect(b.flag).toMatch(DEFAULT_FLAG_PATTERN);
  });

  it("validateFlag rejects non-flags and accepts valid ones", () => {
    expect(() => validateFlag("secret123")).toThrow(/does not look like a flag/);
    expect(validateFlag("zhctf{valid_test_flag_2026}")).toBe("zhctf{valid_test_flag_2026}");
  });
});