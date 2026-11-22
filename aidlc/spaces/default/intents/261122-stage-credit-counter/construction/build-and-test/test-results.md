# Test Results

## Build

- Status: not applicable. There is nothing to build (plain JavaScript, no dependencies).

## Unit Tests

- Command: `node --test aidlc-stage-credits/test/credits.test.mjs`
- Exit code: 0
- Result: 6 tests, 6 passed, 0 failed, 0 skipped.
- Covered: FR1, FR1.1, FR1.2, FR2, FR3, NFR1 (on made-up sample data).

## Real-Data Run

- Command: `node aidlc-stage-credits/src/credits-by-stage.mjs`, exit code 0.
- Printed: 14 credit records, total 50.029 credits. intent-capture 15.674, requirements-analysis 11.751, code-generation 21.226, outside a stage 1.378, bootstrap stages and build-and-test 0.000.
- Build-and-test shows 0.000 for the same reason as before: Kiro records a turn's usage when the turn ends.

## Independent Recount (NFR1 evidence)

- A separate one-off script, written only for this check and not kept, read the same Kiro session files directly: it kept the session whose `workspacePaths` contain this project, took every `usage_summary` line, and summed every `promptTurnSummaries` entry whose unit is `credit`.
- Result: 1 session with a message file, 14 records, 50.029 credits. This equals the script's TOTAL, so the script reads and adds the records correctly and loses none.
- This does not show that the figure equals what Kiro's own usage page reports by itself. That page cannot be read from here.
- Person-reported check: the person said they compared a figure from the script with Kiro's usage page and it matches (their word, in this chat; I did not see the comparison). This is the evidence for NFR1's match with Kiro's report.

## Coverage

- No coverage tool was run. The `poc` scope and the Testing Contract set no coverage floor.

## Loop-Back Log

- No loop-back has been used.
