# Component Inventory

## lib.mjs
- Type: library module. Path: aidlc-stage-credits/src/lib.mjs.
- Responsibility: parse stage windows and credit records, select sessions, attribute credits, format the report. Pure, no I/O.
- Depends on: nothing.

## project.mjs
- Type: data-access module. Path: aidlc-stage-credits/src/project.mjs.
- Responsibility: find the project root, active space and active intent; read an intent's audit text; find the project's Kiro sessions (by `workspacePaths` or `rootPaths`); read credit records. Read-only.
- Depends on: lib.mjs, node:fs, node:path.

## exportfile.mjs
- Type: library module. Path: aidlc-stage-credits/src/exportfile.mjs.
- Responsibility: build, serialize (JSON/CSV), parse and validate the export file (format version 1). Pure.
- Depends on: lib.mjs (`OUTSIDE`).

## actions.mjs
- Type: service module. Path: aidlc-stage-credits/src/actions.mjs.
- Responsibility: `runReport`, `runExport`, `runCombine`; `collectRun` runs the one-intent report workflow. Never prints or exits.
- Depends on: lib.mjs, project.mjs, exportfile.mjs, node:fs, node:os, node:path.

## cli.mjs
- Type: command-line layer. Path: aidlc-stage-credits/src/cli.mjs.
- Responsibility: read the action and options, call the actions, return what to print and the exit code; usage text; tool version from package.json.
- Depends on: actions.mjs, node:fs.

## actions.test.mjs
- Type: tests (15 cases: report, error paths, export, combine). Path: aidlc-stage-credits/test/actions.test.mjs. Depends on: actions.mjs, exportfile.mjs.

## cli.test.mjs
- Type: tests (5 cases, one spawns the bin script). Path: aidlc-stage-credits/test/cli.test.mjs. Depends on: cli.mjs.

## credits.test.mjs
- Type: unit tests (6 cases on made-up data). Path: aidlc-stage-credits/test/credits.test.mjs. Depends on: lib.mjs.

## exportfile.test.mjs
- Type: unit tests (6 cases: round trip, fields, CSV quoting, rejections). Path: aidlc-stage-credits/test/exportfile.test.mjs. Depends on: exportfile.mjs.

## figures.test.mjs
- Type: figure check (3 cases) on anonymized real records. Path: aidlc-stage-credits/test/figures.test.mjs. Fixtures: test/fixtures/real-sample/{records,windows,expected}.json. Depends on: lib.mjs.

## project.test.mjs
- Type: unit tests (6 cases on temp folders). Path: aidlc-stage-credits/test/project.test.mjs. Depends on: project.mjs.

## Outside the focused scan (read only briefly, prior knowledge kept)
- aidlc-stage-credits/bin/aidlc-stage-credits.mjs: entry; passes `process.cwd()` and `~/.kiro/sessions` to `main`, prints stdout and stderr, sets the exit code.
- SKILL.md: Kiro skill definition. package.json: manifest (`aidlc-stage-credits` 1.0.0, private, ESM, `bin`, `engines.node >=22`, `files`: bin, src, SKILL.md, README.md).
