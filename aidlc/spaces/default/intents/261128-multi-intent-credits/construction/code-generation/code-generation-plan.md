# Code Generation Plan

## Summary

- Builds: the report now covers all intents of the active space by default, as one combined table (intent, stage, credits) with a project total and one "outside any stage" line, and `--intent <name>` narrows it
- Touches: `aidlc-stage-credits/` only: 1 new `src/intents.mjs`, changes to `src/project.mjs`, `src/actions.mjs`, `src/cli.mjs`, `package.json`, `README.md`, `SKILL.md`, 1 new test file and updates to 3 existing ones; `src/lib.mjs`, `export` and `combine` stay as they are
- Tests: about 14 new or updated unit tests (Node's built-in runner), one per requirement; the 41 existing tests stay green except the ones that assume one intent, which are updated on purpose

## Assumptions

- The package version moves from 1.0.0 to 1.1.0, because the plain report's output changes. If 1.0.0 was never released, say so and I will keep it.
- The report no longer needs an active intent to run. It stops only when there is no project, no Kiro data, no session for the project, no intent at all, or no intent with an audit file. `export` still needs the active intent, as before.
- The header line becomes `Intents: <n>   Sessions: <n>   Credit records: <n>`.

## Approach

- `src/lib.mjs` stays unchanged. The new logic sits in `src/intents.mjs`: it builds each intent's stage windows with the existing parser, then gives every credit record to the one window that started latest across all selected intents, or to "outside any stage".
- The old one-intent code path in `actions.mjs` stays for `export`.
- No new dependency; Node 22 built-in modules only.

## Implementation Steps

Testing approach: test-after (from the Testing Contract). Each layer is implemented, then its tests are written and run.

- [x] Step 1: Test runner readiness. The runner is Node's built-in `node --test`; the 41 existing tests are the baseline. The exact command is in `unit-test-instructions.md`.
- [x] Step 2: Data access (`src/project.mjs`): `listIntents` reads the active space's `intents.json` (the `dirName` of each entry) and falls back to the intent folders when the file is missing or unreadable, skipping folders that start with a dot; `readIntentAudits` reads the audit text of each named intent and reports the ones with no audit file. (FR1.1; assumptions on `intents.json` and missing audits)
- [x] Step 3: Tests for Step 2 in `test/project.test.mjs`: `intents.json` listing, fallback to folders, dot folders skipped, an intent with no audit file reported. Write and run.
- [x] Step 4: Business logic (`src/intents.mjs`): `attributeIntents` (windows per intent, one record to the latest-starting window across all intents, the rest to "outside any stage"), `formatIntentsReport` (combined table of intent, stage, credits at 3 decimals, then the project total and the single "outside any stage" line). Stage windows still open at the end of an audit end at that audit's last time. (FR2, FR2.1, FR2.2, FR2.3, NFR1)
- [x] Step 5: Tests for Step 4 in `test/intents.test.mjs`: two intents with a record between them (counted once on "outside any stage"), overlapping windows (latest-starting wins), the total equals the sum of all rows plus outside, rows at 3 decimals. Write and run.
- [x] Step 6: Actions and command line (`src/actions.mjs`, `src/cli.mjs`): `runReport` takes an optional list of intents and prints the multi-intent report; naming an unknown intent stops with a message that lists the intents that exist and exit code 1; intents without an audit file are left out with one warning line each; `report` accepts `--intent <name>` (repeatable) and `--intent=<name>`; the usage text shows it; `export` and `combine` are not changed. (FR1, FR1.2, FR1.3, FR3, FR4, NFR2)
- [x] Step 7: Tests for Step 6: update the report tests in `test/actions.test.mjs` and `test/cli.test.mjs` that assume one intent (the header and the table) to the new default, keep the error-path tests (no sessions folder, no audit file, no session for the project, no project), and add: all intents by default, `--intent` narrowing, an unknown intent, an intent without an audit file, `export` still writing the active intent, and report writing nothing. Write and run.
- [x] Step 8: Package and documentation: version 1.1.0 in `package.json`; update `README.md` and `SKILL.md` for the all-intents default and `--intent`. The root `README.md` and `LICENSE` that you added are left as they are. (FR1)
- [ ] Step 9: Documentation and traceability: write `code-summary.md` and `traceability.json` for this stage.

## Traceability

| Plan step | Requirement |
|---|---|
| Step 2, 3 | FR1.1 |
| Step 4, 5 | FR2, FR2.1, FR2.2, FR2.3, NFR1 |
| Step 6, 7 | FR1, FR1.2, FR1.3, FR3, FR4, NFR2 |
| Step 8 | FR1 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
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
  "input_sha256": "sha256:93cc30bfac56d027325cddc54558e948a7b3c5795d8b95fdf54be9cef18eb687",
  "contract_sha256": "sha256:55ed9576f1182de0615d887392d7d201fa1b6dc3599767f7260b15939c91944b"
}
```
