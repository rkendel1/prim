import type { CapabilitySpec } from "./identity.ts";
import type { Timestamp } from "../contracts/schemas.ts";

export interface TimeCapabilitySpec extends CapabilitySpec {
  name: "time";
  version: "1.0.0";
  kind: "primitive";
  interface: "cap://time.now";
}

export const TIME_CAPABILITY: TimeCapabilitySpec = {
  name: "time",
  version: "1.0.0",
  kind: "primitive",
  interface: "cap://time.now"
};

export interface TimeCapabilityHost {
  "time.now"?: () => Promise<Timestamp> | Timestamp;
}

export function validateTimeCapability(capability: CapabilitySpec): capability is TimeCapabilitySpec {
  return (
    capability.name === "time" &&
    capability.version === "1.0.0" &&
    capability.kind === "primitive" &&
    capability.interface === "cap://time.now"
  );
}

export async function getTimestamp(host: TimeCapabilityHost): Promise<Timestamp> {
  const now = host["time.now"];
  if (!now) {
    throw new Error("Capability host does not implement time.now");
  }

  return await now();
}
