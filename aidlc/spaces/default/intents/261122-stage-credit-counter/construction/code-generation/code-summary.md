# Code Summary

## Files Created

All under `aidlc-stage-credits/` at the project root. No existing file was changed.

- `package.json`: marks the folder as an ES-module package with no dependencies.
- `src/lib.mjs`: the logic. `parseStageWindows` reads stage start and end times from the AI-DLC audit file; `parseCreditRecords` reads credit records from Kiro's `messages.jsonl`; `selectSessions` keeps only this project's sessions; `attribute` adds credits per stage with an "outside a stage" total; `formatReport` prints the table.
- `src/credits-by-stage.mjs`: the script a person runs. It is read-only.
- `test/credits.test.mjs`: 6 unit tests.
- `SKILL.md`: the Kiro skill that tells the assistant to run the script at each stage gate and on request.
- `README.md`: what it reads, how to run it, known limits.

## Key Implementation Decisions

- Credits come from Kiro's own `usage_summary` records in each session's `messages.jsonl`; stages come from the AI-DLC audit file. The two are joined by timestamp.
- A stage that was entered again keeps each entry as its own window. A stage still running ends at the last timestamp seen.
- No dependency and no Bun: plain JavaScript on Node 22.

## Test Coverage Summary

- 6 tests, 6 pass: FR1, FR1.1, FR1.2, FR2, FR3, NFR1. No coverage figure is measured; the poc scope sets no coverage floor.
- Command: `node --test aidlc-stage-credits/test/credits.test.mjs`.

## Tests Written but Not Executed

- None. The entry script has no unit test by design; it was run once by hand against the real data.

## Real Run Result

- The script found 2 sessions and 13 credit records and printed a total of 28.803 credits: intent-capture 15.674, requirements-analysis 11.751, outside a stage 1.378, bootstrap stages and code-generation 0.000.
- Code-generation shows 0.000 because Kiro writes a turn's usage only when the turn ends, so the current turn is not in the data yet. The bootstrap stages show 0.000 because they start and end in the same second.
- The total was not compared with Kiro's own usage page, so NFR1 (exact match) is not yet confirmed.

## Deviations from the Plan

- The developer ticked plan Step 2 without writing a separate file; the runner command was already recorded in `unit-test-instructions.md`.
- Plan Step 7's `code-summary.md` and `traceability.json` were written by the conductor after the build.
