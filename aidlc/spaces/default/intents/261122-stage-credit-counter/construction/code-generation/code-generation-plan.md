# Code Generation Plan

## Summary

- Builds: a small shareable Kiro skill, `aidlc-stage-credits`, that reports Kiro credits used per AI-DLC stage
- Touches: new folder `aidlc-stage-credits/` at the project root (skill file, one script, one test file); no existing file is changed
- Tests: 6 unit tests (Node's built-in test runner), one per requirement, using small made-up sample data

## Approach

- Kiro already records credit use itself: each chat session under `~/.kiro/sessions/<workspace-id>/<session-id>/` has a `messages.jsonl` with `usage_summary` records (a timestamp plus `usage` in credits per prompt turn) and a `session.json` listing the workspace paths. This proves FR1.1 is feasible. (FR1.1)
- AI-DLC already records when each stage started and ended in the intent's audit file (`STAGE_STARTED` and `STAGE_COMPLETED` rows, each with a timestamp and stage name). (FR1.2)
- The script joins the two by time: each credit record goes to the stage that was running at that timestamp. Credits outside any stage window are reported on a separate "outside a stage" line. (FR1.2)
- No new dependency: plain JavaScript on Node 22 (the machine has no Bun). The script is read-only: it never writes to Kiro's or AI-DLC's files.
- Packaging (FR4): everything lives in one self-contained folder, with a `SKILL.md` at its root, so it can be copied into another project's skills folder or packaged later. A real installable package is left to a later step; this proof of concept shows the logic works.

## Implementation Steps

Testing approach: test-after (from the Testing Contract). Each layer is implemented, then its tests are written and run.

- [x] Step 1: Project structure. Create `aidlc-stage-credits/` with `src/` and `test/` folders and a small `package.json` (`"type": "module"`, no dependencies). (FR4)
- [x] Step 2: Test runner readiness. The runner is Node's built-in `node --test`; record the exact command in `unit-test-instructions.md`. No install needed.
- [x] Step 3: Business logic, implement `src/lib.mjs`:
  - `parseStageWindows(auditText)` reads `STAGE_STARTED` / `STAGE_COMPLETED` rows into `{stage, start, end}` windows. (FR1.2)
  - `parseCreditRecords(jsonlText)` reads `usage_summary` records into `{timestamp, credits}`. (FR1.1)
  - `attribute(windows, records)` adds up credits per stage, plus an "outside a stage" total. (FR1, FR1.2)
  - `formatReport(totals)` returns the per-stage table shown on screen. (FR2, FR3)
- [x] Step 4: Business logic tests. Write and run `test/credits.test.mjs`: one test each for FR1, FR1.1, FR1.2, FR2, FR3 (only the sessions whose workspace path matches this project are counted) and NFR1 (the stage totals add up exactly to the sum of the records read, so no credit is lost or invented).
- [x] Step 5: Entry script. Implement `src/credits-by-stage.mjs`: finds this project's sessions in `~/.kiro/sessions` by matching `workspacePaths` in `session.json`, finds the active intent's audit file, runs the logic above, and prints the report. Read-only; clear message and non-zero exit when no Kiro data or no audit file is found. (FR1, FR2, FR3)
- [x] Step 6: Skill file. Write `SKILL.md` telling the assistant to run the script at each stage gate and on request, and to show its output. (FR2, FR4)
- [x] Step 7: Documentation and traceability. Write `README.md` in the skill folder (what it reads, how to run, known limits) and the stage's `code-summary.md` and `traceability.json`.

## Traceability

| Plan step | Requirement |
|---|---|
| Step 1, 6 | FR4 |
| Step 3, 5 | FR1, FR1.1, FR1.2 |
| Step 3, 5, 6 | FR2 |
| Step 3, 5 | FR3 |
| Step 3, 4 | NFR1 |

## Known Limits (carried from the requirements, not solved here)

- Whether Kiro's figures are detailed enough to equal what Kiro itself reports (NFR1) is checked only against the same records the script reads; a comparison with Kiro's own usage page is a manual check after the build.
- Credits spent between stages, or in a stage resumed later, appear on the "outside a stage" line rather than being assigned to a stage.
- The per-person view only (FR3); there is no shared team report.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "poc",
  "test_strategy": "minimal",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop`, `classic` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:8ea1ef920e68ca73437a39f413355d71d0d909a57d5d857da31deb5d9355e261",
  "contract_sha256": "sha256:615d0f211ddcd07aebccb0dd6a68c9e4b811c5fab93b04a37004687ace5379de"
}
```
