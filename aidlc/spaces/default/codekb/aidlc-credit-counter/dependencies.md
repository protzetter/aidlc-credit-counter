# Dependencies

## Third-party packages
None (no `dependencies` or `devDependencies` in package.json).

## Node built-ins
node:fs, node:os, node:path (entry script); node:test, node:assert/strict (tests).

## Internal
`credits-by-stage.mjs -> lib.mjs`; `credits.test.mjs -> lib.mjs`. No cycles.

## External data contracts (runtime dependencies, not packages)
- Kiro session records under `~/.kiro/sessions` (format not documented by Kiro): see api-documentation.md.
- AI-DLC audit file layout and the `aidlc/spaces/default/intents/<intent>/audit/` path: owned by AI-DLC and may change with its releases.
