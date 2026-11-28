# Requirements Analysis Questions

## Sources

- [desc] Initial description: "i want to add a feature the credits used acropss multipkle intents"
- [scope] Workflow-selected scope: `express`.
- The code knowledge base, `code-quality-assessment.md` > "What the multi-intent feature needs to know": today the tool reports only the active intent; it never reads `intents.json`; a Kiro session carries no intent, so a credit record belongs to an intent only through the time of its stages; credits spent during other intents fall into "outside a stage".

## Q1. [Product] How should a person ask for the multi-intent view?

Why asked: `report` today shows one intent and its output is checked by existing tests, so a new view is best added beside it.

A. A new action, for example `aidlc-stage-credits intents`, that prints credits for several intents
B. An option on the existing action, for example `aidlc-stage-credits report --all-intents`
C. Not yet defined
X. Other (please specify)

[Answer]: X. Other: by default the report covers all intents (no separate action or option is needed to ask for it)

## Q2. [Product] Which intents are included?

Why asked: a project can hold finished and in-flight intents, and AI-DLC lists them all in `intents.json`.

A. Every intent of the active space that `intents.json` lists
B. Only the intents the person names, for example `--intent <name>`
C. Every intent of the active space by default, and `--intent <name>` (repeatable) narrows it
D. Not yet defined
X. Other (please specify)

[Answer]: C

## Q3. [Product] How are the results laid out, and where do credits that fall in no intent's stage go?

Why asked: one Kiro chat can span several intents, so some credits fall in no stage of any intent, and the person must see where they went.

A. One stage table per intent, then one project total; credits that fall in no stage of any intent appear once, on a single project-wide "outside any stage" line
B. One combined table with a row per intent and stage, then the project total and the same single "outside any stage" line
C. Not yet defined
X. Other (please specify)

[Answer]: B

## Q4. [Product] Should exports and the team view cover several intents too?

Why asked: `export` writes one file for one intent today, and `combine` already groups files by person and intent.

A. Not in this version: the multi-intent view is on screen only
B. Yes: `export` writes one file per intent, in the format `combine` already reads
C. Not yet defined
X. Other (please specify)

[Answer]: A
