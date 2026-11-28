# Code Structure

## Layout
```
aidlc-stage-credits/
  package.json              Configuration (ESM, bin entry, engines node>=22, test script)
  SKILL.md                  Skill definition (static/doc)
  README.md                 Documentation
  bin/aidlc-stage-credits.mjs   Entry: the only file that prints and sets the exit code (outside the focused scan)
  src/cli.mjs               Controller: argument parsing, usage text, tool version
  src/actions.mjs           Service: runReport, runExport, runCombine (returns stdout, stderr, exitCode)
  src/project.mjs           Data access: project root, space, intent, audit text, sessions, credit records (read-only)
  src/lib.mjs               Utility: pure parsing, attribution and report formatting
  src/exportfile.mjs        Utility: export object, JSON/CSV write and read, validation (pure)
  test/*.test.mjs           Tests: actions, cli, credits, exportfile, figures, project (41 cases)
  test/fixtures/real-sample/  Anonymized records, windows and expected figures (JSON)
.github/workflows/          test.yml, release.yml (CI, outside the focused scan)
OUTCOMES.md                 Record of the first version
```
Everything else at the root belongs to AI-DLC and is out of scope. The earlier single entry script `src/credits-by-stage.mjs` no longer exists.

## Patterns
- Functional core, thin I/O layer; named exports only; JSDoc on each export; business-rule tags (BR, FR, NFR) in comments and test names.
- Times are epoch milliseconds; windows are `{stage,start,end}`, records `{timestamp,credits}`; totals are `{stages:[{stage,credits}], outside, total}`.
- Errors: actions return `{stdout:'', stderr, exitCode}` (`fail()` in actions.mjs); unreadable files and bad lines are skipped by empty `catch`.
- Every function takes folders as arguments (`startDir`, `sessionsRoot`), so tests use temp folders; the bin script supplies `process.cwd()` and `~/.kiro/sessions`.
- Imports flow one way: bin -> cli -> actions -> project/exportfile -> lib. No cycles.

Exports and signatures: see api-documentation.md.
