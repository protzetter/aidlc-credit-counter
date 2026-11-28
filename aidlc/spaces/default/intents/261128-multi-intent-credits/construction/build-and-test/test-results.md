# Test Results

## Build

- Not applicable: nothing to build (plain JavaScript, no dependencies).
- `npm pack ./aidlc-stage-credits --dry-run`: exit 0, `aidlc-stage-credits@1.1.0`, 10 files (README, SKILL.md, the command, 6 source files including the new `src/intents.mjs`, package.json), 13.0 kB, no tests or fixtures.

## Unit Tests

- `node --test "aidlc-stage-credits/test/*.test.mjs"` from the project root: exit 0, 53 tests, 53 passed, 0 failed, 0 skipped.
- `npm test --prefix aidlc-stage-credits` (as CI runs it): the same 53 pass.
- Before this work there were 41 tests; 12 were added or changed in number, and the report tests that assumed one intent (`actions.test.mjs`, `cli.test.mjs`) were updated on purpose, as the plan says. The figure check (`figures.test.mjs`), the export and combine tests and the first version's `credits.test.mjs` were not changed and pass.
- Covered: FR1.1 (intent list from `intents.json` and the folder fallback), FR1.2 (`--intent`, repeatable), FR1.3 (unknown intent), FR2 (combined table, one "outside any stage" line, overlap rule), FR3 (header), FR4 (export unchanged), NFR1 (total equals the sum), NFR2 (read-only).

## Real-Data Runs (this project)

| Command | Result |
|---|---|
| `aidlc-stage-credits` (all intents) | 3 intents, 2 sessions, 61 credit records, total 333.610 (run before this stage's tests) |
| `aidlc-stage-credits --intent 261128-multi-intent-credits` | exit 0; 1 intent, 62 records; its stages 24.912, 19.596, 23.154; "outside any stage" 289.103; total 356.764 |
| `aidlc-stage-credits --intent nope` | exit 1; "Unknown intent: nope. Intents that exist: ..." lists the three |

- With `--intent`, every credit outside the named intent's stages shows on "outside any stage", including the credits of the other two intents (289.103). That follows the requirement (outside means the stages of the selected intents) but can surprise a reader.
- A stage still open at the end of its audit shows 0.000 (here `build-and-test` while this stage runs); its credits sit on "outside any stage" until the stage completes. This is the assumption recorded in the requirements.

## Coverage

- No coverage tool was run. The express plan's Testing Contract sets no coverage floor.

## Loop-Back Log

- No loop-back has been used.
