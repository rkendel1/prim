import type { ModuleSpec } from "../auth/index.ts";

export function usesTimeCapability(moduleSpec: ModuleSpec): boolean {
  return moduleSpec.capabilities.includes("time");
}

export function isTimeNonDeterministic(moduleSpec: ModuleSpec): boolean {
  return usesTimeCapability(moduleSpec) && moduleSpec.determinism === "non_deterministic";
}
