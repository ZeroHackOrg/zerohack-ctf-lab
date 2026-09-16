/** Pure container planning for a scenario. No docker engine calls. */

import type { ContainerPlan, LabService } from "@zerohack/shared";
import { requireScenario } from "./scenarios.ts";

function planImage(service: LabService, idx: number): string {
  if (service.image && service.image.trim()) return service.image.trim();
  throw new Error(`Service at index ${idx} has no image`);
}

/**
 * Build one ContainerPlan per service. Deterministic: identical input produces
 * identical output, and `exposePort: 0` deliberately leaves portBindings empty.
 */
export function buildPlan(scenarioId: string): ContainerPlan[] {
  const s = requireScenario(scenarioId);
  return s.services.map((service, idx) => {
    const plan: ContainerPlan = {
      scenarioId: s.id,
      scenarioName: s.name,
      name: `zh-${s.id}-${idx}`,
      image: planImage(service, idx),
      network: s.network ?? `zhnet-${s.id}`,
      env: { ...service.env, SCENARIO_ID: s.id, FLAG_ENV: s.flagEnv },
      portBindings: [],
    };
    if (service.exposePort && service.exposePort > 0) {
      plan.portBindings = [{ host: service.exposePort, container: service.internalPort ?? service.exposePort }];
    }
    if (service.cmd && service.cmd.length) plan.cmd = [...service.cmd];
    return plan;
  });
}