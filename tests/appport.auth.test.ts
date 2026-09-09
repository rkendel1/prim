import test from "node:test";
import assert from "node:assert/strict";

import { builtInCapabilities, loadAppPort } from "../src/appport.ts";
import { getTimestamp } from "../src/capabilities/time.ts";
import { validateCredentials, validateIdentity, validateTimestamp } from "../src/contracts/schemas.ts";
import * as appportSdk from "../src/index.ts";
import { isTimeNonDeterministic, usesTimeCapability } from "../src/time/index.ts";

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

test("loads time module as non-deterministic", () => {
  const appport = loadAppPort({
    id: "app://time-basic",
    version: "0.1.0",
    modules: [
      {
        name: "module.now",
        version: "1.0.0",
        language: "rust",
        artifact: "wasm://module.now@1.0.0",
        determinism: "pure",
        io: {
          input: "schema://unit",
          output: "schema://timestamp"
        },
        capabilities: ["time"]
      }
    ],
    capabilities: [
      {
        name: "time",
        version: "1.0.0",
        kind: "primitive",
        interface: "cap://time.now"
      }
    ]
  });

  const timeModule = appport.modules[0];
  assert.equal(usesTimeCapability(timeModule), true);
  assert.equal(isTimeNonDeterministic(timeModule), true);
  assert.equal(timeModule.determinism, "non_deterministic");
  assert.equal(timeModule.io.output, "schema://timestamp");
  assert.equal(appport.schemas.get("schema://timestamp")?.format, "date-time");
});

test("rejects invalid time capability declaration", () => {
  assert.throws(
    () =>
      loadAppPort({
        id: "app://time-invalid",
        version: "0.1.0",
        modules: [],
        capabilities: [
          {
            name: "time",
            version: "1.0.0",
            kind: "primitive",
            interface: "cap://time.clock"
          }
        ]
      }),
    /time primitive capability/
  );
});

test("rejects time module without manifest time capability", () => {
  assert.throws(
    () =>
      loadAppPort({
        id: "app://time-missing",
        version: "0.1.0",
        modules: [
          {
            name: "module.now",
            version: "1.0.0",
            language: "rust",
            artifact: "wasm://module.now@1.0.0",
            determinism: "pure",
            io: {
              input: "schema://unit",
              output: "schema://timestamp"
            },
            capabilities: ["time"]
          }
        ],
        capabilities: []
      }),
    /manifest\.capabilities does not define it/
  );
});

test("timestamp schema helper validates date-time strings", () => {
  assert.equal(validateTimestamp("2026-09-09T21:51:38.100Z"), true);
  assert.equal(validateTimestamp("2026-09-09T21:51:38+00:00"), true);
  assert.equal(validateTimestamp("2026-09-09"), false);
});

test("time host helper returns timestamps", async () => {
  await assert.rejects(() => getTimestamp({}), /time\.now/);
  assert.equal(await getTimestamp({ "time.now": () => "2026-09-09T21:51:38.100Z" }), "2026-09-09T21:51:38.100Z");
});

test("built-in capabilities include time primitive", () => {
  assert.deepEqual(
    builtInCapabilities().map((capability) => capability.name),
    ["identity", "time"]
  );
});

test("extension entrypoint re-exports upstream @appport/sdk surface", () => {
  assert.ok("s" in appportSdk);
});
