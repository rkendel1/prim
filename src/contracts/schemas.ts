export interface JsonSchema {
  $id: string;
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface Credentials {
  provider: string;
  token: string;
}

export interface Identity {
  user_id: string;
  claims?: Record<string, unknown>;
}

export const CREDENTIALS_SCHEMA: JsonSchema = {
  $id: "schema://credentials",
  type: "object",
  properties: {
    provider: { type: "string" },
    token: { type: "string" }
  },
  required: ["provider", "token"]
};

export const IDENTITY_SCHEMA: JsonSchema = {
  $id: "schema://identity",
  type: "object",
  properties: {
    user_id: { type: "string" },
    claims: { type: "object" }
  },
  required: ["user_id"]
};

export function registerBuiltInSchemas(registry: Map<string, JsonSchema>): void {
  registry.set(CREDENTIALS_SCHEMA.$id, CREDENTIALS_SCHEMA);
  registry.set(IDENTITY_SCHEMA.$id, IDENTITY_SCHEMA);
}

export function validateCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { provider?: unknown; token?: unknown };
  return typeof candidate.provider === "string" && typeof candidate.token === "string";
}

export function validateIdentity(value: unknown): value is Identity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { user_id?: unknown; claims?: unknown };
  if (typeof candidate.user_id !== "string") {
    return false;
  }

  if (candidate.claims === undefined) {
    return true;
  }

  return !!candidate.claims && typeof candidate.claims === "object";
}
