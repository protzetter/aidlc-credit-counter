# Code Summary

## Files Created or Modified

All under `aidlc-stage-credits/` unless noted.

- `bin/aidlc-stage-credits.mjs` (new): the command; reads the command line and ends the process.
- `src/cli.mjs` (new): reads the action and options (`--person`, `--force`, `-h`), calls the actions, prints, returns the exit code; unknown action prints the usage and exits 1.
- `src/actions.mjs` (new): `runReport`, `runExport`, `runCombine`; each takes explicit folders and options and returns output text and an exit code.
- `src/project.mjs` (new): finds the project root, the active space and intent, this project's Kiro sessions, the audit text and the credit records.
- `src/exportfile.mjs` (new): builds, writes (JSON and CSV), reads back and validates an export file.
- `package.json` (modified): version 1.0.0, `bin`, `engines.node >=22`, `files`, `private: true`, `test` = `node --test`.
- `README.md` and `SKILL.md` (modified, as the approved plan says): new command, export and combine actions, the test command.
- `.github/workflows/test.yml` (new): runs the tests with Node 22 on every push and pull request.
- `src/credits-by-stage.mjs` (removed): its logic moved into `project.mjs` and `actions.mjs`.
- Unchanged: `src/lib.mjs` and `test/credits.test.mjs`.

## Tests

- 40 tests, 40 pass: the 6 existing ones plus `exportfile` (7), `project` (5), `actions` (15), `cli` (5) and `figures` (3).
- Run from the project root: `node --test "aidlc-stage-credits/test/*.test.mjs"` (quotes needed), or `npm test` inside `aidlc-stage-credits/`.
- Test data: temporary folders and inline strings, plus anonymized fixtures in `test/fixtures/real-sample/` (credit records with a timestamp and credits only, stage windows with stage name, start and end, and `expected.json`).

## Key Decisions

- `lib.mjs` stays unchanged; new files wrap it so every action can be tested with explicit folders.
- Exports keep credits at full precision; only printing rounds to 3 decimals.
- `-h` and `--help` print the usage and exit 0 (an addition by the developer).

## Tests Written but Not Executed

- None. The GitHub Actions workflow itself has not been run; it was not possible here. Its command (`npm test` in `aidlc-stage-credits/`) passes locally.

## Figure Check Status

- The expected figures in `expected.json` come from the tool's own output on the anonymized records, with `confirmed_by_hand: false`. They have NOT been compared with Kiro's usage page, so the "matches Kiro" target is unverified until someone does and sets the flag to true.

## Deviations from the Plan

- The plan's test command `node --test aidlc-stage-credits/test/` fails on Node 22.22 (a folder name is treated as a file); the quoted pattern above works. `unit-test-instructions.md` and the README were updated to it.
- `-h` / `--help` was added (see Key Decisions).
- The real runs from the project root and from a subfolder printed all zeros: the only Kiro session for the renamed project folder has no messages file yet, so there were no credits to count.
