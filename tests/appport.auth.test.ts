import test from "node:test";
import assert from "node:assert/strict";

import { loadAppPort } from "../src/appport.ts";
import { validateCredentials, validateIdentity } from "../src/contracts/schemas.ts";
import * as appportSdk from "../src/index.ts";

const validManifest = {
  id: "app://auth-basic",
  version: "0.1.0",
  modules: [
    {
      name: "module.authenticate",
      version: "1.0.0",
      language: "rust",
      artifact: "wasm://module.authenticate@1.0.0",
      determinism: "non_deterministic",
      io: {
        input: "schema://credentials",
        output: "schema://identity"
      },
      capabilities: ["identity"]
    }
  ],
  capabilities: [
    {
      name: "identity",
      version: "1.0.0",
      kind: "primitive",
      interface: "cap://identity.verify"
    }
  ],
  auth: {
    entry: "module.authenticate"
  }
} as const;

test("loads auth module from auth.entry", () => {
  const appport = loadAppPort(validManifest);
  assert.equal(appport.auth?.entry, "module.authenticate");
  assert.equal(appport.getAuthModule().name, "module.authenticate");
});

test("rejects invalid auth entry", () => {
  assert.throws(
    () =>
      loadAppPort({
        ...validManifest,
        auth: { entry: "missing.module" }
      }),
    /must reference a module/
  );
});

test("rejects auth module missing identity capability", () => {
  assert.throws(
    () =>
      loadAppPort({
        ...validManifest,
        modules: [
          {
            ...validManifest.modules[0],
            capabilities: []
          }
        ]
      }),
    /must include 'identity' capability/
  );
});

test("credentials and identity schema helpers validate objects", () => {
  assert.equal(validateCredentials({ provider: "appport", token: "abc" }), true);
  assert.equal(validateCredentials({ provider: "appport" }), false);

  assert.equal(validateIdentity({ user_id: "u-1", claims: { role: "admin" } }), true);
  assert.equal(validateIdentity({ claims: {} }), false);
});

test("extension entrypoint re-exports upstream @appport/sdk surface", () => {
  assert.ok("s" in appportSdk);
});
