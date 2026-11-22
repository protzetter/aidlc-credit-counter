# Code Quality Assessment

## Quick ratings
| Aspect | Rating | Evidence |
|---|---|---|
| Naming clarity | good | descriptive function and file names |
| Function size | good | lib functions are short; entry script is one flat top-level block |
| Error handling | fair | clear `fail()` messages for 4 conditions; bare `catch {}` hides unreadable sessions/messages |
| Test presence | fair | lib covered by 6 tests; entry script untested |
| Duplication | good | none notable |
| Dead code | good | none found |

## Tests, lint, CI, docs
- Tests: `node:test`, 6 cases on made-up data (aidlc-stage-credits/test/credits.test.mjs); no coverage config; no real or anonymized samples; NFR1 test only checks that sums are internally consistent, not a match with Kiro's usage page.
- Lint/format: none. CI/CD: none. Git: none.
- Docs: README.md and SKILL.md accurate; JSDoc on lib exports.

## Technical debt and findings for the industrialization intent
1. **Packaging**: only a copyable folder; `private: true`, no `bin`, `engines`, changelog or install path. An installable Kiro extension (Power or global skill) is the stated goal.
2. **Hardcoded space path**: `aidlc/spaces/default/intents` (credits-by-stage.mjs:24) ignores the active space; also `active-intent` is read relative to cwd.
3. **Entry script not testable**: all logic runs at import time with `process.exit`; refactor into functions taking paths (sessions root, project, audit dir) so error paths can be tested: missing sessions root, missing/blank `active-intent`, no audit files, no matching sessions, unreadable session or messages file, malformed lines.
4. **Dependence on Kiro's undocumented session format** (`usage_summary`, `promptTurnSummaries[].unit/usage`, `session.json.workspacePaths`): a change gives silent zeros; add a format guard that fails loudly (e.g. records found but none with a credit unit), and ask the Kiro team for a supported source.
5. **Audit parsing assumes field order** (Timestamp, Event, Stage on consecutive lines); no tolerance for extra fields in between.
6. **Attribution limits**: credits between stages or in resumed stages land on the "outside a stage" line; bootstrap stages show 0.000; the running stage shows 0 until its turn ends; rejection and loop-back not handled.
7. **Repeatable figure check (NFR1)**: the one match with Kiro's usage page was manual; add a repeatable check across several stages with anonymized fixtures of real records.
8. **Team view**: only the current person's run is shown; no export or per-intent history for a team lead.
9. **Path matching**: `workspacePaths` compared as strings (symlinks, case, Windows separators not handled); the project is `process.cwd()`, so running from a subfolder finds nothing.
10. **Process**: no git, no CI; add a repository, a CI job running `node --test`, and a Node version pin.
