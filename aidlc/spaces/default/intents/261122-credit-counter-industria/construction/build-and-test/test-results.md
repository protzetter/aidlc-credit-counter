# Test Results

## Build

- Not applicable: nothing to build (plain JavaScript, no dependencies).
- `npm pack ./aidlc-stage-credits --dry-run`: exit 0, 9 files, 11.1 kB, no tests or fixtures included.
- `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs --help`: exit 0, prints the three actions.

## Unit Tests

- Command: `node --test "aidlc-stage-credits/test/*.test.mjs"` (project root): exit 0.
- Result: 40 tests, 40 passed, 0 failed, 0 skipped. The same 40 pass with `npm test --prefix aidlc-stage-credits`, as CI runs it.
- By file: `credits` 6 (the first version's, unchanged), `exportfile` 6, `project` 5, `actions` 15, `cli` 5, `figures` 3.
- Covered: FR1.x (command and package), FR2.x (space, intent, project root), FR3.x (export), FR4 (combine), FR5.x (figure check), FR6.x (testable actions and the six error paths), NFR2 (read-only).
- Not executed: the GitHub Actions workflow (`.github/workflows/test.yml`); there is no GitHub repository yet and it cannot run here.

## Figure Check (NFR1)

- The test compares the tool's per-stage and total figures on the anonymized sample with `expected.json` at 3 decimals, and it passes.
- `expected.json` was filled from the tool's own output. It first had `confirmed_by_hand: false`. The person then reported, in this chat, that they checked the figures manually against Kiro's usage page and they match (their word; I did not see the comparison), so the flag is now `true`. The 40 tests pass again with the flag set.
- The test itself is still a regression check against `expected.json`; the match with Kiro rests on the person's comparison.
- Figures in the sample: total 165.238; intent-capture 15.674, requirements-analysis 11.751, code-generation 21.226, build-and-test 12.788, outside a stage 103.800, bootstrap stages 0.

## Real-Data Run

- Not repeated for this stage: from the renamed project folder the only session has no messages file yet, so a real run prints zeros (see `code-summary.md`).

## Coverage

- No coverage tool was run. The `refactor` scope and the Testing Contract set no coverage floor.

## Loop-Back Log

- No loop-back has been used.
