# Code Quality Assessment

## Quick ratings
| Aspect | Rating | Evidence |
|---|---|---|
| Naming clarity | good | descriptive modules and functions; BR/FR tags tie code to requirements |
| Function size | good | small functions; `runCombine` is the longest (about 80 lines) |
| Error handling | good | every action returns a message and exit code; bare `catch {}` skips unreadable sessions, audit shards and lines silently |
| Test presence | good | 41 `node:test` cases across all five source modules, plus a figure check on anonymized real records |
| Duplication | good | none notable |
| Dead code | good | `intentsDir` is imported by `actions.mjs` but not used there (minor) |

## Tests, lint, CI, docs
- Tests: `node:test`, 41 cases (actions 15, cli 5, credits 6, exportfile 6, figures 3, project 6); no coverage config; temp-folder fixtures; figure fixtures in `test/fixtures/real-sample/`.
- Lint/format: none found. CI: GitHub Actions `test.yml` runs `npm test` on Node 22.
- Docs: README.md, SKILL.md, JSDoc on exports.

## What the multi-intent feature needs to know
1. **How the active intent is chosen**: `readActiveIntent(root, space)` reads the text file `aidlc/spaces/<space>/intents/active-intent` and trims it; the value is the intent FOLDER name (today `261128-multi-intent-credits`). Blank or missing gives `''` and `collectRun` stops with "No active AI-DLC intent found at <file>". The space comes from `aidlc/active-space`, default `default` (`readActiveSpace`); the earlier fixed-`default` finding no longer holds.
2. **Where intents and audit files live**: `intents/<folder>/audit/*.md` (`readAudit`, files sorted, joined with `\n---\n`; a missing folder gives `files: []` and an "No audit file found in <dir>" error). The tool never reads `intents/intents.json`, which lists every intent with `uuid`, `slug`, `dirName` (the folder), `scope`, `status` (`complete` or `in-flight`) and `request`. In this project there are three intents, each with one audit shard named after the machine (`macbook-m4-patrick-home-<id>.md`); a team project could hold several shards per intent. Also in `intents/`: dot folders (`.aidlc-engine`, `.aidlc-codekb-transactions`) that an enumeration by folder must skip; `intents.json` or the folder names are the safer source.
3. **How sessions map to intents**: they do not. `findSessions` matches a session to the PROJECT only (`workspacePaths` or `rootPaths` equal the project root); `session.json` has no intent field, and a chat can span several intents (this project's chats do). The only link from a credit record to an intent is its timestamp against that intent's stage windows. All records of all matching sessions are read once; `collectRun` attributes them to the single active intent's windows, so credits spent during other intents fall into "outside a stage" today.
4. **The "outside a stage" line**: `attribute` puts every record whose timestamp is in no window on `outside` (`OUTSIDE = 'outside a stage'`, `src/lib.mjs`); it is part of `total` and of the table. With several intents, "outside" must be defined per intent or globally (a record in no intent's window), and a record in two overlapping intents' windows needs a stated rule; the "latest-starting window wins" rule only applies inside one `attribute` call. Open windows end at `now` (or the last audit timestamp), so an in-flight or never-closed intent keeps claiming credits to the present; sample audit headers show intents on 2026-11-22 and 2026-11-28.
5. **Export format's intent field**: format version 1 has one `intent` string (folder name) per file, validated non-empty (`exportProblem`), repeated on every CSV row, and the rows must agree on it (`csvToExport`). `combine` keys on `(person, intent)` and prints one section per intent. A multi-intent export could be several files (one per intent, compatible with `combine`) or a format change; a higher `format_version` is rejected by older tools, and the BR3.4 test asserts that an export holds only the allowed fields.
6. **Tests that assume one intent**: `actions.test.mjs`, `cli.test.mjs` and the `project.test.mjs` audit test build a single intent `i-1` with `active-intent` = `i-1` and assert the exact header `Intent: i-1   Sessions: 1   Credit records: 3`, the exact error texts (including the active-intent file path), and the table with `outside a stage 0.250`; `exportfile.test.mjs` uses intents `i1` and `261122-example`; no test writes `intents.json` or a second intent folder. `figures.test.mjs` uses a one-intent real sample (stage windows and records only). Changing the report header or the `outside` figure for the default report breaks these assertions on purpose, so a new view should be added next to them rather than changing `report`.

## Technical debt and other findings
1. **Packaging**: `bin` entry, `engines` and a release workflow now exist; the stated goal (an installable Kiro extension) is not confirmed from the scanned paths.
2. **Dependence on Kiro's undocumented session format** (`usage_summary`, `promptTurnSummaries[].unit/usage`, `session.json` paths): a format change gives silent zeros; no format guard.
3. **Audit parsing assumes field order** (Timestamp, Event, Stage on consecutive lines); `parseStageWindows` keys open windows by stage name only, so shards or overlapping intents with the same stage names would mix if joined.
4. **Attribution limits**: credits between stages land on "outside"; bootstrap stages show 0.000; the running stage shows 0 until its turn ends; rejection and loop-back are not handled.
5. **Path matching**: session paths are compared as strings after trimming trailing `/` (symlinks, case, Windows separators not handled).
6. **Team view**: `combine` merges per-person exports per intent; there is no per-intent history for one person in a single report.
