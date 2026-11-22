# Component Inventory

## lib.mjs
- Type: library module. Path: aidlc-stage-credits/src/lib.mjs.
- Responsibility: parse stage windows and credit records, select sessions, attribute credits, format the report. Pure, no I/O.
- Depends on: nothing.

## credits-by-stage.mjs
- Type: CLI entry script. Path: aidlc-stage-credits/src/credits-by-stage.mjs.
- Responsibility: locate the active intent, audit files, Kiro sessions; read them; call lib; print or fail.
- Depends on: lib.mjs, node:fs, node:os, node:path.

## credits.test.mjs
- Type: unit tests (6 cases: FR1, FR1.1, FR1.2, FR2, FR3, NFR1) on made-up data. Path: aidlc-stage-credits/test/credits.test.mjs.
- Depends on: lib.mjs, node:test, node:assert/strict.

## SKILL.md
- Type: Kiro skill definition; runs the entry script. Path: aidlc-stage-credits/SKILL.md.

## package.json
- Type: package manifest (`aidlc-stage-credits` 0.1.0, private, ESM). Path: aidlc-stage-credits/package.json.
