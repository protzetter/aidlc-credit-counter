# Outcomes Pack
**Scope**: poc
**Stages delivered**: 7 approved / 7 total
**Duration**: 41 min

## 1. What Was Built

- **Project:** `aidlc-stage-credits`, a Kiro skill that reports Kiro credits used per AI-DLC stage. Source: the intent in `aidlc/spaces/default/intents/261122-stage-credit-counter/`.
- **Scope the workflow ran at:** `poc` (minimal depth, minimal tests). Plan: intent capture, requirements analysis, code generation, build and test, after the 3 initialization stages.
- **Units of work:** none. This was zero-Unit work, one code-generation pass.
- **What it contains:** one logic module (`src/lib.mjs`), one entry script (`src/credits-by-stage.mjs`), 6 unit tests, a skill file (`SKILL.md`) and a README.
- **Key decisions and why:**
  - Credit data comes from Kiro's own `usage_summary` records in `~/.kiro/sessions/.../messages.jsonl` (Q1: use Kiro's own data).
  - Credits are attributed to a stage by timestamp, against `STAGE_STARTED` and `STAGE_COMPLETED` rows in the AI-DLC audit file.
  - Plain JavaScript on Node 22 with no dependency, because the machine has no Bun.
  - Each person sees only their own run on screen (Q3). Success means exact match with Kiro's figures (Q2). Packaging as a shareable extension was requested (Q4) but only a copyable folder was built.
- **Tech stack:** Node 22.22.3 (built-in `node:test`, `node:fs`, `node:path`). No third-party packages.

## 2. Repository Structure

```
aidlc-stage-credits/
  package.json            ES-module marker, version 0.1.0, private
  SKILL.md                Kiro skill: run the script at each stage gate and on request
  README.md               what it reads, how to run, known limits
  src/
    lib.mjs               parseStageWindows, parseCreditRecords, selectSessions, attribute, formatReport
    credits-by-stage.mjs  read-only entry script
  test/
    credits.test.mjs      6 unit tests on made-up data
aidlc/                    AI-DLC workflow record (decisions, reviews, audit)
OUTCOMES.md               this file
```

## 3. Setup Guide

- **Prerequisites:** Node 22 or newer; Kiro with at least one session in this project folder; the AI-DLC audit file of the active intent.
- **Local setup:** none. There is nothing to install.
- **Environment variables:** none.
- **Run it:** from the project root, `node aidlc-stage-credits/src/credits-by-stage.mjs`.
- **Run the tests:** `node --test aidlc-stage-credits/test/credits.test.mjs`.

## 4. Build and Deploy

- **Build:** none; plain JavaScript modules.
- **Full test suite:** the one command above. Result at close: 6 of 6 pass.
- **Real-data check at close:** 14 credit records, 50.029 credits (intent-capture 15.674, requirements-analysis 11.751, code-generation 21.226, outside a stage 1.378). An independent recount of the same files gave the same figures. You reported a match with Kiro's own usage page.
- **Deploy:** none. To share it, copy `aidlc-stage-credits/` into another project.

## 5. Architecture Decisions

- **Credit source:** Kiro's session records (chosen). Alternatives offered at requirements: estimate from the AI-DLC audit trail, or type the figure in by hand. Rejected because Kiro's own data was readable and exact.
- **Attribution:** by timestamp window per stage; credits outside any window go on an "outside a stage" line. Re-entered stages are summed over all their windows.
- **Delivery form:** a skill folder plus script, not an installable package. The requirement asked for an installable extension; the proof of concept only proves the logic.
- **Constraints:** read-only toward Kiro's and AI-DLC's files; no dependency; `poc` scope with no coverage floor; AI-DLC team rules (org defaults only, no team or project rules were set).

## 6. What to Commit

| Artifact | Action | Destination |
|----------|--------|-------------|
| `aidlc-stage-credits/` | Commit | project root (or its own repo) |
| `aidlc/` workflow record (requirements, plan, reviews, audit) | Commit | `aidlc/` (already the right place) |
| `decisions.md` (per stage) | None exist; none were written by the poc | — |
| Architecture summary (1 page) | Not needed for a poc; write one for the industrial version | `docs/architecture.md` |
| NFR summary table | Not needed for a poc; write one for the industrial version | `docs/nfr-summary.md` |

Note: this project has no git yet, so nothing is committed. Run `git init` and commit to get an undo.

## 7. Workflow Footprint

- Stages: 7 approved, 0 failed, 0 pending
- Memory entries captured: 0 (0 interpretations, 0 deviations, 0 trade-offs, 0 open questions)
- Learnings captured: 0 from orchestrator, 0 from user additions
- Checks: 38 run, 37 passed, 1 failed (the build-and-test document check on stage inputs; fixed before approval), 0 could not run

## 8. Known Limitations and What to Tackle Next

**Open review findings accepted as risk at the gates**
- Intent capture: no pass/fail success threshold; "teams have no way to see credits" was stated as fact; the budget owner's interest was inferred; the first version has no boundary.
- Requirements: no behaviour when Kiro's data is missing or too coarse; "live or at each gate" left two behaviours open; no attribution rule for credits between stages or on resume; the budget owner's view is not served; packaging form not tied to the intent.
- Code: NFR1's test checks only the code's own sums; the audit parser assumes a field order (it held on the real audit file); the space path is fixed to `default`; only a folder was built, not an installable extension; the entry script has no tests.

**Known limits of the tool**
- Credits between stages or in a resumed stage show on the "outside a stage" line.
- The stage running right now shows 0.000 until its turn ends.
- The bootstrap stages start and end in the same second, so they show 0.000.
- It depends on Kiro's session record format, which is not a documented interface.
- NFR1 (match with Kiro's usage page) rests on your one comparison; I did not see it.

**Recommended next steps to industrialize**
1. Package it as an installable Kiro Power or a global skill, with a version and changelog.
2. Read the active space and intent instead of the fixed `default` path.
3. Check with the Kiro team whether a supported usage source exists, and add a format check that fails loudly if the records change.
4. Handle re-entry, rejection and loop-back attribution, and show the current stage's credits.
5. Make the NFR1 check repeatable across several stages.
6. Add tests for the script's error paths and run them in CI on real anonymized samples.
7. Add a team view (export file, per-intent history) for the team lead or budget owner.
8. Print a stage's credits automatically when it completes, through a hook instead of relying on `SKILL.md`.
