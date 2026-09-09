export interface AuthSpec {
  entry: string;
}

export function validateAuthSpec(auth: unknown, moduleNames: Set<string>): AuthSpec {
  if (!auth || typeof auth !== "object") {
    throw new Error("auth must be an object");
  }

  const entry = (auth as { entry?: unknown }).entry;
  if (typeof entry !== "string" || entry.length === 0) {
    throw new Error("auth.entry must be a non-empty string");
  }

  if (!moduleNames.has(entry)) {
    throw new Error(`auth.entry '${entry}' must reference a module in manifest.modules`);
  }

  return { entry };
}
