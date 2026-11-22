# Code Generation Plan

## Summary

- Builds: the industrialized `aidlc-stage-credits` package: one command with report, export and combine actions, finding the active space and intent, testable error paths, a repeatable figure check and a CI workflow
- Touches: `aidlc-stage-credits/` (new `bin/`, 5 new `src/` files and 5 new test files, `package.json`, `README.md`, `SKILL.md` changed, the old `src/credits-by-stage.mjs` removed), plus a new `.github/workflows/test.yml`
- Tests: about 28 unit tests with Node's built-in runner (one per requirement, the six error paths, and the figure check); `lib.mjs` and its 6 existing tests stay as they are
- Adds: 1 field no requirement asks for (`confirmed_by_hand` in the expected-figures test file); see Assumptions

## Assumptions

- The expected-figures file for the figure check (FR5.1) has one field the requirements do not name, `confirmed_by_hand` (true or false), added in Step 9. The check needs the figures recorded by hand from Kiro's usage page, and I cannot read that page. I will fill the file from the tool's own output on the anonymized records with `confirmed_by_hand: false`, so the test runs but Build and Test reports the "matches Kiro" target as unverified until you compare the figures with Kiro's usage page and set the flag to true. Say if you would rather give me the figures now.
- The package stays `"private": true` (installable from the folder or the repository, not publishable to a public registry by accident), because where it is published is still an open question in the requirements.
- The README and `SKILL.md` already in `aidlc-stage-credits/` are changed in Step 11 (new command name and the two new actions). Say if you want either left as it is.

## Approach

- Keep `src/lib.mjs` (pure logic, 6 passing tests) unchanged. Add small files around it, each with one job, so every action can be tested with explicit folders (BR6.3).
- `bin/aidlc-stage-credits.mjs` is the only file that reads the command line options, prints, and ends the process.
- No new dependency; Node 22 built-in modules only.

## Implementation Steps

Testing approach: test-after (from the Testing Contract). Each layer is implemented, then its tests are written and run.

- [x] Step 1: Project structure and package configuration. Add `bin/`, set `package.json` to version 1.0.0 with a `bin` entry `aidlc-stage-credits`, `engines.node >=22`, `files` (bin, src, SKILL.md, README.md) and the `test` script `node --test`; keep `private: true`. (FR1.1, FR1.2, FR1.3; BR6.2)
- [x] Step 2: Test runner readiness. The runner is Node's built-in `node --test`; the existing 6 tests are the baseline and stay green. Record the exact command in `unit-test-instructions.md`.
- [x] Step 3: Data model, export file (`src/exportfile.mjs`): build an export from a run report, write JSON and CSV (credits at full precision, CSV quoting, `outside` row marked by kind), read either back, and check every ExportFile constraint (the unusable-file reasons). (FR3.1, FR3.2, FR4; BR3.2, BR3.4, BR3.5, BR4.2)
- [x] Step 4: Tests for Step 3 in `test/exportfile.test.mjs`: JSON and CSV round trip give the same data; an export holds only the allowed fields; CSV quoting of commas, quotes and line breaks; each unusable-file reason is rejected (empty file, bad JSON, missing field, newer `format_version`, bad `exported_at`, empty person, negative or non-number credits, duplicate stage name, reserved stage name, no stage row). Write and run.
- [x] Step 5: Data access, project and sessions (`src/project.mjs`): find the project root by going up to the nearest folder holding `aidlc`; read the active space (default `default`) and the active intent; list this project's Kiro sessions by project root; read the audit text and credit records, skipping unreadable files and lines. (FR2.1, FR2.2, FR6.1; BR1.1 to BR1.4, BR2.1, BR6.3)
- [x] Step 6: Tests for Step 5 in `test/project.test.mjs`, using temporary folders: space read from `aidlc/active-space` and the default; run from a subfolder; no AI-DLC folder; missing or blank `active-intent`; sessions matched by project root; unreadable session and bad line skipped. Write and run.
- [x] Step 7: Business logic, actions (`src/actions.mjs`): `runReport`, `runExport` and `runCombine`, each taking its folders and options and returning output text and an exit code, with the error messages and exit codes of the rules; combine keeps the newest export per person and intent, lists the ignored ones, orders rows as BR4.6 says, and reports skipped files. (FR1.1, FR2, FR3, FR4, FR6.1, FR6.2; BR2.1 to BR4.6, BR8.1)
- [x] Step 8: Tests for Step 7 in `test/actions.test.mjs`: the four stop conditions of the report (no sessions folder, no active intent, no audit file, no session for the project) each give the stated message and exit code 1; export writes only the named file, refuses an existing file without `--force`, a wrong ending, and an empty person; report and combine write nothing; combine keeps the newest, lists the ignored, skips bad files with exit code 2, never mixes intents, and orders rows. Write and run.
- [x] Step 9: Repeatable figure check: add anonymized real records (timestamp and credits only), stage windows (stage name, start, end) and `expected.json` (stage names, totals, `confirmed_by_hand`) under `test/fixtures/real-sample/`, and `test/figures.test.mjs` that compares the tool's per-stage and total figures with the expected ones at 3 decimals, and a second test that fails on any other field in those files. Write and run. (FR5.1, FR5.2, NFR1; BR5.1, BR5.2)
- [x] Step 10: API / command line (`bin/aidlc-stage-credits.mjs` and `src/cli.mjs`): read the action and options (`--person`, `--force`), call the actions, print, and exit with the returned code; an unknown action prints a usage message and exits 1. Write and run `test/cli.test.mjs` (usage, unknown action, exit codes passed through). Remove the old `src/credits-by-stage.mjs` (its logic now lives in Steps 5 and 7). (FR1.1, FR6.1; BR6.1)
- [x] Step 11: Environment and documentation. Add `.github/workflows/test.yml` (tests on Node 22 on every push and pull request, working folder `aidlc-stage-credits`) (FR7; BR7.1). Update `README.md` and `SKILL.md` for the new command and the export and combine actions. (FR1.2, FR7)
- [ ] Step 12: Documentation and traceability: write `code-summary.md` and `traceability.json` for this stage.

## Traceability

| Plan step | Requirement |
|---|---|
| Step 1, 11 | FR1.1, FR1.2, FR1.3 |
| Step 5, 6 | FR2.1, FR2.2 |
| Step 3, 4, 7, 8 | FR3.1, FR3.2, FR4 |
| Step 9 | FR5.1, FR5.2, NFR1 |
| Step 5, 7, 8, 10 | FR6.1, FR6.2 |
| Step 11 | FR7 |
| Step 7, 8 | NFR2 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "refactor",
  "test_strategy": "minimal",
  "project_type": "brownfield",
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
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
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
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
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
  "input_sha256": "sha256:30d8704b051c46abcd67cb9f3ce197aa7814d6524d3d40281c545d587380d693",
  "contract_sha256": "sha256:b47dfb884f4b374479e642d196233f7fe895d53ab12dd0474f6a3c0382a9c21c"
}
```
