# Code Summary

## Files Created or Modified

All under `aidlc-stage-credits/`.

- `src/intents.mjs` (new): `attributeIntents` gives each credit record to the stage window that started latest across all selected intents, or to "outside any stage"; `formatIntentsReport` prints the combined table (intent, stage, credits at 3 decimals), the single "outside any stage" line and the total. Pure functions, no file access.
- `src/project.mjs` (modified): `listIntents` reads the active space's `intents.json` (falling back to the intent folders, skipping dot folders) and `readIntentAudits` reads each intent's audit text and reports the ones with none.
- `src/actions.mjs` (modified): `runReport` now covers all intents by default and takes an optional list of intents; `export` and `combine` and the one-intent path behind `export` are unchanged.
- `src/cli.mjs` (modified): `report` accepts `--intent <name>` (repeatable) and `--intent=<name>`; the usage text shows it.
- `package.json` (modified): version 1.1.0.
- `README.md`, `SKILL.md` (modified, as the plan says): the all-intents default and `--intent`.
- `test/intents.test.mjs` (new); `test/project.test.mjs`, `test/actions.test.mjs`, `test/cli.test.mjs` (updated and extended).
- Unchanged: `src/lib.mjs`, `src/exportfile.mjs`, the figure check and its fixtures, the root `README.md` and `LICENSE`.

## Behaviour

- Header `Intents: <n>   Sessions: <n>   Credit records: <n>`, then one combined table, then `outside any stage` and `TOTAL`.
- `--intent <name>` narrows the report; an unknown name stops with `Unknown intent: <names>. Intents that exist: <list>.` and exit 1.
- An intent with no audit file is left out with a warning on stderr (exit 0). Other stop conditions: no project, no Kiro data, no session for the project, `No AI-DLC intents found in <dir>.`, `No audit file found for any intent in <dir>.`
- A stage window still open at the end of an intent's audit ends at that audit's last time (the requirements assumption).

## Tests

- 53 tests, 53 pass (the earlier 41 plus new and updated ones), from the project root and with `npm test --prefix aidlc-stage-credits`.
- Command: `node --test "aidlc-stage-credits/test/*.test.mjs"`.
- Report-writes-nothing and export-writes-only-the-named-file are covered by the existing snapshot test, not new ones.

## Real Run

- `Intents: 3   Sessions: 2   Credit records: 61`; total 333.610: stage-credit-counter 61.439, credit-counter-industria 204.530, multi-intent-credits 44.508, outside any stage 23.134. The printed rows add up to 333.611, one thousandth more than the total, from rounding each row to 3 decimals.
- The stage being worked on right now (this intent's code-generation) shows 0.000: its window is still open, so under the assumption above it is empty, and those credits sit on "outside any stage" until the stage completes.

## Tests Written but Not Executed

- None.

## Deviations from the Plan

- `runReport` no longer takes a `now` option, since open windows end at the audit's last time. `export` still uses it.
- The developer ticked the plan boxes through the shell instead of the edit tool; the result is the same.
