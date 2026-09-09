export interface JsonSchema {
  $id: string;
  type: string;
  format?: string;
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

export type Timestamp = string;

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

export const TIMESTAMP_SCHEMA: JsonSchema = {
  $id: "schema://timestamp",
  type: "string",
  format: "date-time"
};

export function registerBuiltInSchemas(registry: Map<string, JsonSchema>): void {
  registry.set(CREDENTIALS_SCHEMA.$id, CREDENTIALS_SCHEMA);
  registry.set(IDENTITY_SCHEMA.$id, IDENTITY_SCHEMA);
  registry.set(TIMESTAMP_SCHEMA.$id, TIMESTAMP_SCHEMA);
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

export function validateTimestamp(value: unknown): value is Timestamp {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
}
