# Build Instructions

Inputs: `code-generation-plan.md` (what was built), `unit-test-instructions.md` (the unit test command) and `code-summary.md` (files, decisions and deviations), all from Code Generation.

## Dependency Installation

- None. The package uses only Node's built-in modules. Nothing to install.

## Environment Setup

- Node 22 or newer on the PATH (the package declares `engines.node >=22`; Node 22.22.3 was used here).
- Run commands from the project root, `/Users/patrickrotzetter/dev/aidlc-credit-counter`, unless stated.
- The tool reads Kiro's session files under `~/.kiro/sessions/` and the active intent's audit file; it writes only an export file when asked.

## Build Commands

- None. The code is plain JavaScript modules (`.mjs`), so there is nothing to compile or bundle.

## Build Verification

- The command starts: `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs --help` prints the usage.
- The package holds what it should: `npm pack ./aidlc-stage-credits --dry-run` lists 9 files (README.md, SKILL.md, bin, 5 source files and package.json) and no tests or fixtures. It writes nothing.
- Install the package from the folder: `npm install -g ./aidlc-stage-credits` (not run here; it would change this machine's global packages).

## Tests

- From the project root: `node --test "aidlc-stage-credits/test/*.test.mjs"` (the quotes are needed; the bare folder form fails on Node 22.22).
- As CI runs it: `npm test --prefix aidlc-stage-credits`, or `npm test` inside `aidlc-stage-credits/`.

## Troubleshooting

- "No active AI-DLC intent found": the tool reads `aidlc/active-space` (default `default`) and that space's `active-intent`; start AI-DLC work first.
- "No Kiro sessions found for <project>": sessions are matched by the project root path. After a folder rename the old sessions keep the old path, and a new session only has credit records once a chat turn has finished.
- The current stage shows 0.000: Kiro writes a turn's usage when the turn ends, so the stage running now appears after its turn finishes.
