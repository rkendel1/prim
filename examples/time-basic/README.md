# Time basic

Minimal time-aware module manifest:

```ts
import manifest from "./appport.json" with { type: "json" };
import { loadAppPort } from "../../src/appport.ts";

const appport = loadAppPort(manifest);

const mod = appport.modules.find((moduleSpec) => moduleSpec.capabilities.includes("time"));

mod?.determinism; // "non_deterministic"
mod?.capabilities; // ["time"]
mod?.io.output; // "schema://timestamp"
```
