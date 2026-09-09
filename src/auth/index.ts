export interface ModuleSpec {
  name: string;
  version: string;
  language: string;
  artifact: string;
  determinism: "pure" | "replayable" | "non_deterministic";
  io: {
    input: string;
    output: string;
  };
  capabilities: string[];
  flow?: {
    branches: Record<string, string>;
  };
}

export function isAuthenticationModule(moduleSpec: ModuleSpec): boolean {
  return (
    moduleSpec.determinism === "non_deterministic" &&
    moduleSpec.io.input === "schema://credentials" &&
    moduleSpec.io.output === "schema://identity" &&
    moduleSpec.capabilities.includes("identity")
  );
}

export function validateAuthenticationModule(moduleSpec: ModuleSpec): void {
  if (moduleSpec.determinism !== "non_deterministic") {
    throw new Error(`Authentication module '${moduleSpec.name}' must be non_deterministic`);
  }

  if (!moduleSpec.capabilities.includes("identity")) {
    throw new Error(`Authentication module '${moduleSpec.name}' must include 'identity' capability`);
  }

  if (moduleSpec.io.input !== "schema://credentials") {
    throw new Error(`Authentication module '${moduleSpec.name}' must use schema://credentials input`);
  }

  if (moduleSpec.io.output !== "schema://identity") {
    throw new Error(`Authentication module '${moduleSpec.name}' must use schema://identity output`);
  }
}
