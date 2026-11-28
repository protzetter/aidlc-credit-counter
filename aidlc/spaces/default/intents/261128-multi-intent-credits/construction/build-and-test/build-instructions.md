# Build Instructions

Inputs: `code-generation-plan.md` (what was built), `unit-test-instructions.md` (the test command) and `code-summary.md` (files, behaviour and deviations), all from Code Generation.

## Dependency Installation

- None. The package uses only Node's built-in modules.

## Environment Setup

- Node 22 or newer (the package declares `engines.node >=22`; 22.22.3 was used here).
- Run commands from the project root, `/Users/patrickrotzetter/dev/aidlc-credit-counter`.
- The report reads Kiro's session files under `~/.kiro/sessions/` and the audit files of the active space's intents; it writes only an export file when `export` is asked for.

## Build Commands

- None. The code is plain JavaScript modules, so nothing is compiled or bundled.

## Build Verification

- The package holds what it should: `npm pack ./aidlc-stage-credits --dry-run` lists 10 files for version 1.1.0 and no tests or fixtures.
- The command runs: `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs` prints the multi-intent report.

## Tests

- From the project root: `node --test "aidlc-stage-credits/test/*.test.mjs"` (the quotes are needed; the bare folder form fails on Node 22.22).
- As CI runs it: `npm test --prefix aidlc-stage-credits`.

## Troubleshooting

- "No AI-DLC intents found in <dir>": the active space has no `intents.json` and no intent folders.
- "Unknown intent: <name>": `--intent` takes an intent folder name, as printed in the report's first column.
- A warning that an intent has no audit file: that intent has no stage record yet and is left out.
- A stage shows 0.000 while it is still running: its credits sit on "outside any stage" until the stage completes.
