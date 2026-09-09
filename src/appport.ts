import { isAuthenticationModule, type ModuleSpec, validateAuthenticationModule } from "./auth/index.ts";
import {
  IDENTITY_CAPABILITY,
  isPrimitiveCapability,
  type CapabilitySpec,
  validateIdentityCapability
} from "./capabilities/identity.ts";
import { TIME_CAPABILITY, validateTimeCapability } from "./capabilities/time.ts";
import { type AuthSpec, validateAuthSpec } from "./contracts/auth.ts";
import { type JsonSchema, registerBuiltInSchemas } from "./contracts/schemas.ts";
import { usesTimeCapability } from "./time/index.ts";

export interface AppPortManifest {
  id: string;
  version: string;
  modules: ModuleSpec[];
  capabilities: CapabilitySpec[];
  auth?: AuthSpec;
}

export class AuthenticatedAppPort {
  public readonly id: string;
  public readonly version: string;
  public readonly modules: ModuleSpec[];
  public readonly capabilities: CapabilitySpec[];
  public readonly schemas: Map<string, JsonSchema>;
  public readonly auth?: AuthSpec;

  private readonly moduleMap: Map<string, ModuleSpec>;

  constructor(manifest: AppPortManifest) {
    this.id = manifest.id;
    this.version = manifest.version;
    this.modules = manifest.modules;
    this.capabilities = manifest.capabilities;
    this.auth = manifest.auth;

    this.moduleMap = new Map(this.modules.map((moduleSpec) => [moduleSpec.name, moduleSpec]));
    this.schemas = new Map<string, JsonSchema>();
    registerBuiltInSchemas(this.schemas);
  }

  getAuthModule(): ModuleSpec {
    if (!this.auth) {
      throw new Error("appport.auth is not defined");
    }

    const moduleSpec = this.moduleMap.get(this.auth.entry);
    if (!moduleSpec) {
      throw new Error(`auth.entry '${this.auth.entry}' does not resolve to a module`);
    }

    return moduleSpec;
  }
}

function validateManifestShape(manifest: unknown): asserts manifest is AppPortManifest {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("manifest must be an object");
  }

  const candidate = manifest as Partial<AppPortManifest>;
  if (typeof candidate.id !== "string" || typeof candidate.version !== "string") {
    throw new Error("manifest.id and manifest.version must be strings");
  }

  if (!Array.isArray(candidate.modules)) {
    throw new Error("manifest.modules must be an array");
  }

  if (!Array.isArray(candidate.capabilities)) {
    throw new Error("manifest.capabilities must be an array");
  }
}

function validateModuleSpecs(modules: ModuleSpec[]): void {
  for (const moduleSpec of modules) {
    if (!moduleSpec?.name) {
      throw new Error("module.name is required");
    }

    if (!moduleSpec.io || typeof moduleSpec.io.input !== "string" || typeof moduleSpec.io.output !== "string") {
      throw new Error(`module '${moduleSpec.name}' must define io.input and io.output`);
    }

    if (!Array.isArray(moduleSpec.capabilities)) {
      throw new Error(`module '${moduleSpec.name}' must define capabilities array`);
    }
  }
}

function validateCapabilitySpecs(capabilities: CapabilitySpec[]): void {
  for (const capability of capabilities) {
    if (!capability?.name || !capability.version || !capability.kind || !capability.interface) {
      throw new Error("capabilities entries must define name, version, kind, and interface");
    }

    if (isPrimitiveCapability(capability) && capability.name === "identity" && !validateIdentityCapability(capability)) {
      throw new Error("identity primitive capability must match cap://identity.verify v1.0.0 contract");
    }

    if (capability.name === "time" && !validateTimeCapability(capability)) {
      throw new Error("time primitive capability must match cap://time.now v1.0.0 contract");
    }
  }
}

export function loadAppPort(manifestInput: unknown): AuthenticatedAppPort {
  validateManifestShape(manifestInput);

  const manifest = manifestInput;
  validateModuleSpecs(manifest.modules);
  validateCapabilitySpecs(manifest.capabilities);

  const moduleNames = new Set(manifest.modules.map((moduleSpec) => moduleSpec.name));
  const hasIdentityCapability = manifest.capabilities.some((capability) => validateIdentityCapability(capability));
  const hasTimeCapability = manifest.capabilities.some((capability) => validateTimeCapability(capability));
  const modules = manifest.modules.map((moduleSpec) => {
    if (!usesTimeCapability(moduleSpec)) {
      return moduleSpec;
    }

    if (!hasTimeCapability) {
      throw new Error(`module '${moduleSpec.name}' declares time capability but manifest.capabilities does not define it`);
    }

    return {
      ...moduleSpec,
      determinism: "non_deterministic" as const
    };
  });

  let authSpec: AuthSpec | undefined;
  if (manifest.auth) {
    authSpec = validateAuthSpec(manifest.auth, moduleNames);

    const authModule = modules.find((moduleSpec) => moduleSpec.name === authSpec.entry);
    if (!authModule) {
      throw new Error(`auth.entry '${authSpec.entry}' must reference a valid module`);
    }

    validateAuthenticationModule(authModule);

    if (!authModule.capabilities.includes("identity")) {
      throw new Error(`auth module '${authModule.name}' must declare identity capability`);
    }

    if (!hasIdentityCapability) {
      throw new Error("manifest.capabilities must define the identity primitive capability when auth is configured");
    }
  }

  const appport = new AuthenticatedAppPort({
    id: manifest.id,
    version: manifest.version,
    modules,
    capabilities: manifest.capabilities,
    auth: authSpec
  });

  if (appport.auth) {
    const authModule = appport.getAuthModule();
    if (!isAuthenticationModule(authModule)) {
      throw new Error(`auth module '${authModule.name}' does not satisfy authentication module constraints`);
    }
  }

  return appport;
}

export function builtInCapabilities(): CapabilitySpec[] {
  return [IDENTITY_CAPABILITY, TIME_CAPABILITY];
}
