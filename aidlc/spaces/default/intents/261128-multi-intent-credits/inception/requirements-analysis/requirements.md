# Requirements

## Intent Analysis

The goal is to show the credits used across several intents, not only the active one. The request: "i want to add a feature the credits used acropss multipkle intents". Today the report covers the active intent only, and credits spent during other intents land on its "outside a stage" line. A Kiro chat can span several intents (this project's chats do), so the only link from a credit to an intent is the time of that intent's stages. Sources: the request, the answers in `requirements-analysis-questions.md` (Q1 to Q4) and the code knowledge base: `business-overview.md`, `architecture.md` and `code-structure.md`, and its `code-quality-assessment.md` section "What the multi-intent feature needs to know". The plan is `express`, minimal depth, with no design stage, so the behaviour is stated here in full.

## Functional Requirements

- **FR1** The report covers all intents of the active space by default (Q1, Q2). There is no new action or option to ask for it: the plain `aidlc-stage-credits` and `aidlc-stage-credits report` show every intent.
  - **FR1.1** The intents are those the active space's `intents.json` lists, each with the audit files of its folder.
  - **FR1.2** `--intent <name>` narrows the report to the named intent; it can be given more than once (Q2). `<name>` is an intent folder name, the same text the report prints.
  - **FR1.3** Naming an intent that the space does not list stops the run with a message that names it and the intents that exist, and exit code 1.
  - Acceptance: Given a project with three intents, when the plain report runs, then all three appear; when it runs with `--intent` for one of them, then only that one appears.
- **FR2** The result is one combined table with a row for each intent and stage, then the project total and one "outside any stage" line (Q3).
  - **FR2.1** Each row shows the intent, the stage and its credits at 3 decimals.
  - **FR2.2** A credit record whose time falls in no stage window of any selected intent is counted once, on a single "outside any stage" line, and is part of the project total.
  - **FR2.3** A record goes to the stage window that contains its time, across all selected intents together; when windows of two intents overlap, the window that started latest takes it (the rule the tool already uses within one intent).
  - Acceptance: Given two intents whose stages ran at different times and a credit record between them, when the report runs, then each intent's rows hold only the records inside its stages, and the record between them shows once on the "outside any stage" line.
- **FR3** The header line states how many intents, sessions and credit records the report used.
  - Acceptance: Given two intents, when the report runs, then the header names 2 intents.
- **FR4** `export` and `combine` are unchanged (Q4): `export` still writes the active intent only, in the same format, and `combine` still reads those files.
  - Acceptance: Given the active intent, when `export` runs, then its file holds the same fields as before.

## Non-Functional Requirements

- **NFR1** The project total equals the sum of every row plus the "outside any stage" line, to 3 decimals; no credit is lost or counted twice.
  - Acceptance: Given any set of intents and records, when the report runs, then the printed total equals that sum.
- **NFR2** The report only reads files; it writes nothing (carried from the first version).
  - Acceptance: Given a report run, when it finishes, then no file has been created or changed.

## Constraints

- A Kiro session carries no intent, so a credit belongs to an intent only through the time of its stages (code knowledge base).
- Node 22 and built-in modules only, as today.
- The plain report's output changes from one intent to all intents, so the existing tests that assume one intent (`actions.test.mjs`, `cli.test.mjs`, `project.test.mjs`) must be updated on purpose, and the one-intent figure check keeps working.

## Assumptions

- If `intents.json` is missing or unreadable, the tool uses the intent folders under the space's `intents/` folder instead, skipping folders whose names start with a dot. Rationale: the tool has never read `intents.json`, and a missing file should not stop the report.
- An intent that `intents.json` lists but that has no audit file is left out of the table, with one warning line naming it; it does not stop the run. Rationale: a finished or just-created intent may have no stage windows yet.
- A stage window still open at the end of an intent's audit ends at the last time in that audit file, as today, so an unfinished intent does not claim credits up to the present when another intent is also running. Rationale: the first version's rule was to end it at "now"; with several intents that would swallow later credits. Say if it should stay "now" for the active intent.

## Out of Scope

- A multi-intent export, and a team view across intents (Q4: screen only for now).
- Changing how `export`, `combine` or the export file format work.
- Several spaces at once: only the active space is covered.
- Telling apart which of two overlapping intents truly used a credit: the latest-starting window rule decides.

## Open Questions

- Does "by default" in Q1 mean that the active intent alone is no longer the default view? It is recorded that way, and `--intent <name>` gives the one-intent view.
- Should an intent that the space marks as archived be left out? It is not decided; they are included today if listed.
