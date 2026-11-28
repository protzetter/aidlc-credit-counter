## Developer Code Scan Results

Focused scan, Minimal depth, repo `aidlc-credit-counter` (unrecorded project-root repo), intent `multi-intent-credits`, head commit `3909d771b3c7f36b8e56ad85db13908230b617d3`. Focus: how the tool identifies an intent, reads audit files, matches Kiro sessions and credit records to stages and intents, attributes credits, formats reports, and how export/combine treat intents.

### Scan Coverage
- **Analyzed deeply**:
  - `aidlc-stage-credits/src/` (lib.mjs, project.mjs, actions.mjs, cli.mjs, exportfile.mjs: all read in full)
  - `aidlc-stage-credits/test/` (all six `*.test.mjs` files read or grepped for their cases and intent assumptions; fixtures folder `test/fixtures/real-sample/` listed, its three JSON files not opened)
- **Skimmed only**:
  - `aidlc-stage-credits/bin/` (one 17-line entry script, read; outside the focused paths, so not claimed as analyzed)
  - `aidlc-stage-credits/package.json` and `aidlc-stage-credits/SKILL.md` (read; outside the focused paths)
  - `.github/workflows/test.yml` (read; `release.yml` not opened)
  - Read-only evidence of the AI-DLC layout the tool depends on: `aidlc/spaces/default/intents/intents.json`, `active-intent`, the three intent folder names and their `audit/` folders (one shard file each; event headers grepped). Not analyzed or documented beyond this.
- **Left out**: `.kiro/`, `.git/`, the rest of `aidlc/`, AI-DLC's marked sections of `AGENTS.md` and `.gitignore`, `README.md`, `OUTCOMES.md`, `LICENSE`, `aidlc-stage-credits/README.md`.

### Packages Found
- aidlc-stage-credits — Node package (ESM, private, version 1.0.0, `engines.node >=22`) — JavaScript — CLI that reports, exports and combines Kiro credits per AI-DLC stage; one `bin` entry `aidlc-stage-credits`.

### Build System
- **Type**: none (plain Node ESM, no compile step)
- **Config Files**: `aidlc-stage-credits/package.json` (`"test": "node --test"`)
- **Build Dependencies**: none

### APIs Discovered
- CLI — `src/cli.mjs` `main(argv, env)` — actions `report` (default), `export <file.json|csv> [--person] [--force]`, `combine <file>...`, `--help`/`-h`.
- Action functions — `src/actions.mjs` — `runReport`, `runExport`, `runCombine`, each returning `{stdout, stderr, exitCode}`.
- Data access — `src/project.mjs` — `findProjectRoot`, `readActiveSpace`, `intentsDir`, `readActiveIntent`, `readAudit`, `findSessions`, `readCreditRecords`, `folderExists`, constant `DEFAULT_SPACE`.
- Pure logic — `src/lib.mjs` — `OUTSIDE`, `parseStageWindows`, `parseCreditRecords`, `selectSessions`, `attribute`, `formatReport`.
- Export format — `src/exportfile.mjs` — `FORMAT_VERSION` (1), `CSV_COLUMNS`, `buildExport`, `toJson`, `toCsv`, `csvField`, `serializeExport`, `parseCsvRows`, `exportProblem`, `parseExport`.

### Frameworks & Libraries
- Node.js >= 22 built-ins only: `node:fs`, `node:os`, `node:path`, `node:url`, `node:test`, `node:assert/strict`, `node:child_process` (one test). No third-party packages.

### Test Coverage
- **Test Directories**: `aidlc-stage-credits/test/` (+ `fixtures/real-sample/{records,windows,expected}.json`)
- **Test Frameworks**: `node:test` with `node:assert/strict`
- **Coverage Config**: absent. 41 test cases: actions 15, cli 5, credits 6, exportfile 6, figures 3, project 6.

### Code Quality Indicators
- **Linting**: none found
- **CI/CD**: `.github/workflows/test.yml` (Node 22, `npm test` in `aidlc-stage-credits`); `release.yml` exists (not opened)
- **Documentation**: JSDoc on every export; README.md and SKILL.md present; business-rule tags (BR/FR) in comments and test names

### Technical Debt Signals
- Single-intent assumption throughout `collectRun` (`src/actions.mjs`): one `readActiveIntent` call, one `readAudit`, one `parseStageWindows`; `intent` is a single string on the run.
- `readActiveIntent` reads the `active-intent` file, a folder name such as `261128-multi-intent-credits`; it never reads `intents.json`, so intents are not enumerable by the tool (`src/project.mjs`).
- `readAudit` joins every `.md` in `<intent>/audit/` with `\n---\n` (one shard per clone, in the sample project one each). Windows from several shards would mix, and `parseStageWindows` keys open windows by stage name only.
- `findSessions` returns every session of the project (matched on `workspacePaths` or `rootPaths`); sessions carry no intent field, so a session spanning several intents can be split only by timestamp against each intent's windows (`src/project.mjs`, `src/lib.mjs attribute`).
- `attribute` sends any record outside every window to `outside`; with several intents, a record inside intent A's window but outside intent B's would count as "outside" for B; the time ranges of intents (all stages of an intent) are not modelled.
- `parseStageWindows` open window runs to `now` (or the last timestamp), so an unfinished or abandoned intent claims credits up to now. The sample intents `261122-*` are `complete`, `261128-*` is `in-flight`.
- Test fixtures all build one intent `i-1` with `active-intent` containing `i-1`; no test writes `intents.json` or a second intent folder.
- Export holds exactly one `intent` string per file; CSV repeats it on every row; `combine` groups by `(person, intent)`.

## Handoff Summary
- **Intent-relevant finding**: Intent identity is a folder name read from `aidlc/spaces/<space>/intents/active-intent` (`src/project.mjs` readActiveIntent) and the audit location is `intents/<intent>/audit/*.md` (readAudit); `collectRun` (`src/actions.mjs`) handles exactly one intent, attributing all of the project's Kiro sessions' credit records to that one intent's stage windows. A multi-intent report must enumerate intent folders (the sample layout has `intents.json` rows with `dirName`, `slug`, `status`, plus three folders and one audit shard each), build windows per intent, and decide how a record that falls in no window of any intent is shown (today: `outside a stage`). `attribute` (`src/lib.mjs`) is pure and per-window; `formatReport`, `buildExport`/`toCsv`/`parseExport` and `runCombine` carry a single intent string, so a multi-intent output needs a new section or column rather than a change to the pure attribution.
- **Risks / follow-up**: (1) A record can match windows of two intents when they overlap in time; the "latest-starting window wins" rule is per call to `attribute`, so overlap across intents needs a stated rule. (2) Open windows run to `now`, which over-counts for in-flight or abandoned intents. (3) The export format version is 1 and `exportProblem` rejects a higher version; any new field changes the format contract (BR3.4 test asserts only the allowed fields). (4) The tests assume one intent `i-1` and a literal `outside a stage` line. (5) The scan did not run the tests or the tool; counts of test cases come from source grep. (6) `bin/`, `package.json`, `SKILL.md` and `.github/` were read but are outside the focused paths and recorded as shallow.
