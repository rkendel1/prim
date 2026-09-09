# auth-basic

Minimal AppPort manifest demonstrating authentication-first contract wiring.

- `auth.entry` points to the authentication module
- Module is non-deterministic and uses `schema://credentials` -> `schema://identity`
- Identity primitive capability is declared as `cap://identity.verify`
