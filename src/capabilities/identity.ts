import type { Credentials, Identity } from "../contracts/schemas.ts";

export interface CapabilitySpec {
  name: string;
  version: string;
  kind: string;
  interface: string;
  constraints?: {
    providers?: string[];
    assurance?: string;
  };
}

export interface IdentityCapabilitySpec extends CapabilitySpec {
  name: "identity";
  version: "1.0.0";
  kind: "primitive";
  interface: "cap://identity.verify";
}

export const IDENTITY_CAPABILITY: IdentityCapabilitySpec = {
  name: "identity",
  version: "1.0.0",
  kind: "primitive",
  interface: "cap://identity.verify"
};

export interface CapabilityHost {
  "identity.verify"?: (credentials: Credentials) => Promise<Identity> | Identity;
}

export function isPrimitiveCapability(capability: CapabilitySpec): boolean {
  return capability.kind === "primitive";
}

export function validateIdentityCapability(capability: CapabilitySpec): capability is IdentityCapabilitySpec {
  return (
    capability.name === "identity" &&
    capability.version === "1.0.0" &&
    capability.kind === "primitive" &&
    capability.interface === "cap://identity.verify"
  );
}

export async function verifyIdentity(host: CapabilityHost, credentials: Credentials): Promise<Identity> {
  const verify = host["identity.verify"];
  if (!verify) {
    throw new Error("Capability host does not implement identity.verify");
  }

  return await verify(credentials);
}
