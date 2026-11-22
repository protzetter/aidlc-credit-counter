# Build Instructions

Inputs: `code-generation-plan.md` (what was built), `unit-test-instructions.md` (the unit test command) and `code-summary.md` (files and the real run), all from Code Generation.

## Dependency Installation

- None. The skill uses only Node's built-in modules (Node 22 or newer). Nothing to install.

## Environment Setup

- Node 22 or newer on the PATH. This machine has Node 22.22.3 and no Bun.
- Run everything from the project root: `/Users/patrickrotzetter/dev/claude-aidlc-credits`.
- The script reads (never writes) Kiro's session files under `~/.kiro/sessions/` and the active intent's audit file under `aidlc/spaces/default/intents/`.

## Build Commands

- None. The code is plain JavaScript modules (`.mjs`), so there is nothing to compile, bundle or transpile.

## Build Verification

- Check that the script starts and prints a report: `node aidlc-stage-credits/src/credits-by-stage.mjs`. It should print a stage table and a TOTAL line.

## Troubleshooting

- "No active AI-DLC intent": the script reads `aidlc/spaces/default/intents/active-intent`; another space is not supported yet.
- No Kiro data found: the script finds sessions whose `workspacePaths` contain the current folder; run it from the project root.
- The current stage shows 0.000: Kiro writes a turn's usage when the turn ends, so the stage running right now appears after its turn finishes.
