# Unit Test Instructions

## Framework

- Node's built-in test runner (`node:test`) on Node 22. No install and no dependency.
- Test strategy: Minimal. One test per requirement (FR1, FR1.1, FR1.2, FR2, FR3, NFR1) plus the happy-path floor for the one component, `src/lib.mjs`.

## How to Run This Unit's Tests

```
node --test aidlc-stage-credits/test/credits.test.mjs
```

Run it from the project root. It is scoped to this one test file.

## Expected Coverage

- No coverage floor applies (the `poc` scope adds no extra new-test floor, and the Testing Contract sets none).

## Mocking and Test Data

- Tests use small text strings written inside the test file: a made-up audit excerpt and a made-up `messages.jsonl` excerpt. They never read the real `~/.kiro` folder or the real audit file.
- The entry script (`src/credits-by-stage.mjs`) is checked by hand against the real data; it is not part of the unit tests.
