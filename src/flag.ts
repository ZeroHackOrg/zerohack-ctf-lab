/** Flag minting and verification for lab scenarios. */

import { looksLikeFlag, randomFlag, type LabScenario } from "@zerohack/shared";
import { FLAG_PATTERN_STRING, requireScenario } from "./scenarios.ts";

export interface FlagResult {
  env: string;
  flag: string;
}

/** Mint a fresh flag for a scenario, honoring its flagEnv. */
export function generateFlag(scenarioIdOrObject: string | LabScenario): FlagResult {
  const s = typeof scenarioIdOrObject === "string" ? requireScenario(scenarioIdOrObject) : scenarioIdOrObject;
  return { env: s.flagEnv, flag: randomFlag() };
}

/** Validate a submitted flag against the shared zhctf pattern; throws otherwise. */
export function validateFlag(value: string): string {
  const v = String(value ?? "").trim();
  if (!looksLikeFlag(v)) {
    throw new Error(`"${v}" does not look like a flag (expected ${FLAG_PATTERN_STRING})`);
  }
  return v;
}