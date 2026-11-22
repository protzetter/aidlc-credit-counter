# Requirements

## Intent Analysis

The goal is to turn the proof of concept `aidlc-stage-credits` (it reports Kiro credits per AI-DLC stage for one person's own run) into a tool a team can install and trust. The request is to industrialize it with packaging, a team view, repeatable checks, tests and CI. Sources: the request to industrialize the proof of concept, and the code knowledge base from Reverse Engineering: `business-overview.md` (purpose and first-version limits), `architecture.md` (functional core, imperative shell) and `code-structure.md` (6 files, the entry script untested), plus its `code-quality-assessment.md` (findings 1 to 10). The workflow plan is `refactor`, minimal depth.

## Functional Requirements

- **FR1** The tool is delivered as an npm package that people install and run from the command line, together with the skill file (Q1).
  - **FR1.1** The package installs a command that prints the per-stage credit report.
  - **FR1.2** The package includes the skill file (`SKILL.md`) so Kiro can run the command at stage gates and on request.
  - **FR1.3** The package carries a version number and states the Node version it needs (code-quality finding 1 and 10).
  - Acceptance: Given a machine with the required Node version and a project that uses AI-DLC, when the package is installed and the command is run, then the per-stage report is printed.
- **FR2** The tool finds the active AI-DLC space and intent instead of the fixed `default` space (Q5; code-quality finding 2).
  - **FR2.1** It reads the active space from `aidlc/active-space` (`default` when absent) and the active intent from that space's `active-intent` cursor.
  - **FR2.2** It works when started from any subfolder of the project (Q5; finding 9).
  - Acceptance: Given a project whose active space is not `default`, when the command is run from a subfolder, then the report is for that space's active intent.
- **FR3** A person can export their own run to a file (Q2).
  - **FR3.1** The export is written as CSV or JSON, at the person's choice.
  - **FR3.2** Each exported file names the person, the intent and each stage's credits, and the "outside a stage" credits.
  - Acceptance: Given a run with credit data, when the person asks for an export, then a file is written that holds one row per stage with its credits and the person and intent it belongs to.
- **FR4** The tool reads several exported files and prints one combined report per stage, per person and per intent (Q2).
  - Acceptance: Given exported files from two people for the same intent, when the combined report is requested, then each stage shows each person's credits and the total for the team.
- **FR5** The figures are checked repeatably against Kiro's own numbers (Q3).
  - **FR5.1** The test data holds anonymized copies of real Kiro records, with the expected figures recorded once by hand from Kiro's usage page.
  - **FR5.2** A test fails when the tool's total for that data differs from the recorded figures.
  - Acceptance: Given the anonymized records and their recorded figures, when the tests run, then the tool's totals equal the recorded figures, and a changed total fails the run.
- **FR6** The entry script can be tested (code-quality finding 3), and its error paths have tests.
  - **FR6.1** The script's logic is callable with explicit paths (sessions folder, project folder, audit folder) rather than running only at import.
  - **FR6.2** Tests cover: no Kiro sessions folder, missing or blank `active-intent`, no audit files, no session for the project, an unreadable session file, and a malformed record line.
  - Acceptance: Given each of those conditions, when the tool runs, then it reports a clear message and a non-zero exit, or skips the bad item, as the code does today, and the test says which.
- **FR7** A GitHub Actions workflow runs the tests on every push and pull request (Q4).
  - Acceptance: Given a push to the repository, when the workflow runs, then the tests run on the Node version the package requires and a failing test fails the workflow.

## Non-Functional Requirements

- **NFR1** The per-stage figures equal what Kiro itself reports for the recorded data (carried from the first version; checked through FR5).
  - Acceptance: see FR5.
- **NFR2** The tool only reads Kiro's and AI-DLC's files; it writes only the export file the person asks for (carried from the first version's constraint in `architecture.md`).
  - Acceptance: Given a run without an export request, when it finishes, then no file has been created or changed outside the tool's own folder.

## Constraints

- Kiro's session records are the only credit source; their format is not a documented interface (`business-overview.md`, finding 4).
- Credit data lives on each person's machine, so a team view is built from what each person exports (Q2).
- Node with its built-in modules and no other runtime dependency, as in the first version (`architecture.md`).

## Assumptions

- Each person is identified in an export by a name they give or by their computer user name. Rationale: Q2 asks for a per-person view, but no answer says how a person is named.
- The project will be put in a GitHub repository by the team; the project has no git today. Rationale: Q4 names GitHub Actions, and a workflow needs a repository to run.

## Out of Scope

- Attribution for stages re-entered after a rejection or loop-back, and showing the running stage's credits before its turn ends (Q5: only the gaps that block the team view are fixed).
- Publishing the package to a public registry (not asked for; see Open Questions).

## Open Questions

- Should the tool fail loudly when Kiro's record format changes, so a change does not show as zero credits (code-quality finding 4)? It was not part of the request.
- Where will the package be published or installed from (a public registry, a private one, or straight from the repository)?
- Who records the expected figures for FR5.1, and from which stages of which run?
