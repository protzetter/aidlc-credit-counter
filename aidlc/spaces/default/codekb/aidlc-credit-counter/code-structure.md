# Code Structure

## Layout
```
aidlc-stage-credits/
  package.json            Configuration (ESM marker, scripts test/report)
  SKILL.md                Skill definition (Static/doc)
  README.md               Documentation
  src/lib.mjs             Service/Utility: pure logic (~112 lines)
  src/credits-by-stage.mjs  Controller/entry: all I/O, top-level script (~54 lines)
  test/credits.test.mjs   Test: 6 node:test cases (~77 lines)
OUTCOMES.md               Record of the first version
```
Everything else at the root belongs to AI-DLC and is out of scope.

## Patterns
- Functional core / imperative shell; named exports only; JSDoc on each export.
- Times are epoch milliseconds; windows are `{stage,start,end}`, records `{timestamp,credits}`.
- Error handling: entry script `fail(msg)` prints to stderr and exits 1; unreadable sessions are skipped by empty `catch`.
- No circular imports: entry -> lib; test -> lib.

Exports and signatures: see api-documentation.md.
