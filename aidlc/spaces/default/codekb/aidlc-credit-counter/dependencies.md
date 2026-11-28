# Dependencies

## Third-party packages
None (no `dependencies` or `devDependencies` in package.json).

## Node built-ins
node:fs, node:os, node:path (project, actions); node:fs (cli); node:url, node:child_process, node:test, node:assert/strict (tests).

## Internal
`bin -> cli -> actions -> project, exportfile, lib`; `project -> lib`; `exportfile -> lib`. Tests import the module they test (`actions.test -> actions, exportfile`; `cli.test -> cli` and spawns the bin script; `credits.test`, `figures.test -> lib`; `exportfile.test -> exportfile`; `project.test -> project`). No cycles.

## External data contracts (runtime dependencies, not packages)
- Kiro session records under `~/.kiro/sessions` (format not documented by Kiro): see api-documentation.md.
- AI-DLC layout and audit format, owned by AI-DLC and possibly changing with its releases: `aidlc/active-space`, `aidlc/spaces/<space>/intents/active-intent`, `intents/<intent>/audit/*.md`, and the unread `intents/intents.json`.
