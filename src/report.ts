/** Ready-state LabReport builder. Deterministic when a port resolver is supplied. */

import { randomPort, type LabReport, type LabService } from "@zerohack/shared";
import { buildPlan } from "./plan.ts";
import { requireScenario } from "./scenarios.ts";

export type PortResolver = (service: LabService, idx: number) => number;

function endpointScheme(protocol: LabService["protocol"]): string {
  return protocol === "http" ? "http" : "tcp";
}

function endpointPort(service: LabService, idx: number, portFor?: PortResolver): number {
  if (service.exposePort && service.exposePort > 0) return service.exposePort;
  return portFor?.(service, idx) ?? randomPort(12_000, 49_151);
}

/**
 * Build a `status: "ready"` report for a scenario. Endpoints are
 * `http://localhost:<port>` for http services and `tcp://localhost:<port>`
 * otherwise. Pass `portFor` to pin dynamic (exposePort 0) ports in tests.
 */
export function createReport(scenarioId: string, portFor?: PortResolver): LabReport {
  const s = requireScenario(scenarioId);
  const plans = buildPlan(scenarioId);
  return {
    id: `lab-${s.id}`,
    scenarioId: s.id,
    scenarioName: s.name,
    protocol: s.protocol,
    startedAt: new Date().toISOString(),
    status: "ready",
    endpoints: s.services.map((service, idx) => `${endpointScheme(service.protocol)}://localhost:${endpointPort(service, idx, portFor)}`),
    containers: plans.map((p) => p.name),
    difficulty: s.difficulty,
  };
}