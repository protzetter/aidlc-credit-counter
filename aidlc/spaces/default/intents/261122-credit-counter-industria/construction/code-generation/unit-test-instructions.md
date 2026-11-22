# Unit Test Instructions

## Framework

- Node's built-in test runner (`node:test`) on Node 22. No install and no dependency.
- Test strategy: Minimal. One test per requirement (FR1.x to FR7, NFR1, NFR2), the six error paths FR6.2 names, and the happy-path floor for each new component (`exportfile`, `project`, `actions`, `cli`). The 6 existing tests for `lib.mjs` stay and must stay green.

## How to Run This Unit's Tests

```
node --test "aidlc-stage-credits/test/*.test.mjs"
```

Run it from the project root (keep the quotes so Node, not the shell, expands the pattern). It is scoped to this package's test folder. The same tests run inside the package folder with `npm test`. On Node 22 the plain folder form `node --test aidlc-stage-credits/test/` does not work (Node 22 reads a folder name as a file), which is why the pattern form is recorded here.

## Expected Coverage

- No coverage floor applies: the `refactor` scope adds no extra new-test floor and the Testing Contract sets none.

## Mocking and Test Data

- Tests use temporary folders created for each test (a fake project with an `aidlc` folder, a fake Kiro sessions folder, a fake audit file) and small inline strings. They never read the real `~/.kiro` folder or this project's real audit file.
- The figure check (`test/figures.test.mjs`) uses the anonymized files under `test/fixtures/real-sample/`: records with a timestamp and credits only, stage windows with stage name, start and end, and `expected.json` with stage names, totals and `confirmed_by_hand`. A second test fails when any file holds another field.
- The first-version test file `test/credits.test.mjs` is not changed.
