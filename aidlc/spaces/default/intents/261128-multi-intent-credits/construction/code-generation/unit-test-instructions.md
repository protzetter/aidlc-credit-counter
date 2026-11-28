# Unit Test Instructions

## Framework

- Node's built-in test runner (`node:test`) on Node 22. No install and no dependency.
- Test strategy: Minimal. One test per requirement (FR1 to FR4, NFR1, NFR2) and the happy-path floor for the new component (`intents`). The tests of the first two pieces of work stay and must stay green, except the report tests that assume one intent, which are updated on purpose in Step 7.

## How to Run This Unit's Tests

```
node --test "aidlc-stage-credits/test/*.test.mjs"
```

Run it from the project root; the quotes are needed (the bare folder form fails on Node 22.22). The same tests run inside the package folder with `npm test`.

## Expected Coverage

- No coverage floor applies: the Testing Contract for this plan sets none.

## Mocking and Test Data

- Tests use temporary folders created for each test (a fake project with an `aidlc` folder, an `intents.json`, several intent folders each with an audit file, a fake Kiro sessions folder) and small inline strings. They never read the real `~/.kiro` folder or this project's real audit files.
- The figure check (`test/figures.test.mjs`) and its fixtures under `test/fixtures/real-sample/` are not changed.
