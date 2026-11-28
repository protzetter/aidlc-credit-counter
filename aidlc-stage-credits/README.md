# aidlc-stage-credits

Reports Kiro credits used per AI-DLC stage. Plain Node JavaScript (version 22 or newer), no dependencies. It only reads files; the one exception is the file you ask `export` to write.

## Install

The package is private (not published). Use it from this folder or the repository:

```
npm install -g ./aidlc-stage-credits    # installs the command: aidlc-stage-credits
```

or run it without installing: `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs`.

## Commands

```
aidlc-stage-credits [report] [--intent <name>]...
aidlc-stage-credits export <file.json|file.csv> [--person <name>] [--force]
aidlc-stage-credits combine <file>...
```

- `report` (the default): prints one combined table (intent, stage, credits) for all intents of the active space, then one `outside any stage` line and the TOTAL. `--intent <name>` (or `--intent=<name>`, repeatable) narrows it to the named intent folders; an unknown name stops with the list of intents that exist. An intent with no audit file is left out with a warning on stderr. No active intent is needed. Writes nothing.
- `export <file>`: prints the same table and writes one file with your figures. The format follows the file ending (`.json` or `.csv`). `--person` is the name shown in a team report (default: your computer's user name). An existing file is not replaced unless you give `--force`. Credits are written at full precision.
- `combine <file>...`: reads export files from several people and prints one section per intent with credits per stage per person and a team total. For each person and intent only the newest export counts; older ones are listed as ignored. A file that cannot be used is skipped with a warning. Writes nothing.

Run it from any folder inside the project: the project root is the nearest folder, going up, that holds an `aidlc` folder.

Exit codes: `0` ok; `1` an error stopped the run (missing data, unknown action, bad file name, no files given); `2` combine finished but skipped at least one file.

## What it reads

- `~/.kiro/sessions/<workspace-id>/<session-id>/session.json` (to pick sessions whose `workspacePaths` equal the project root) and `messages.jsonl` (`usage_summary` records: timestamp plus `promptTurnSummaries[].usage` where unit is `credit`).
- `aidlc/active-space` (default space: `default`), `aidlc/spaces/<space>/intents/intents.json` (the `dirName` of each intent; without it, the intent folders, skipping names that start with a dot) and `aidlc/spaces/<space>/intents/active-intent` (only `export` uses it).
- The audit files of each intent under `aidlc/spaces/<space>/intents/<intent>/audit/*.md` (`STAGE_STARTED` / `STAGE_COMPLETED` rows).

Each credit record goes to the stage window that contains its timestamp, across all selected intents (the latest-starting window wins on overlap). Credits outside every window appear once on the "outside any stage" line. In the report, a stage still open at the end of an intent's audit ends at that audit's last time.

## Export format

JSON: `format_version`, `tool_version`, `person`, `intent`, `exported_at`, `stages` (each with `stage` and `credits`) and `outside`. CSV: the columns `format_version,tool_version,person,intent,exported_at,kind,stage,credits`, one row per stage (`kind` is `stage`) and one last row with `kind` `outside`. An export holds nothing else: no paths, session ids, project names or prompts.

## Tests

From the project root: `node --test "aidlc-stage-credits/test/*.test.mjs"`. From this folder: `npm test`.

`test/figures.test.mjs` is the figure check: anonymized records and stage windows under `test/fixtures/real-sample/` against `expected.json`. While `confirmed_by_hand` in `expected.json` is `false`, the expected figures come from this tool's own output and have not been compared with Kiro's usage page; compare them by hand and set it to `true`.

CI (`.github/workflows/test.yml`) runs the tests on Node 22 on every push and pull request.

To share the tool, copy the `aidlc-stage-credits/` folder into another project (`SKILL.md` is at its root).

## Known limits

- Credits between stages, or in a stage resumed later, show on the "outside a stage" line.
- A stage with several starts (re-entry) is summed over all its windows; a stage never completed runs to now.
- Stages that start and finish at the same second (bootstrap stages) get no credits.
- Person names are compared exactly: "Ana" and "ana" are two people.
- The figure check has not yet been confirmed against Kiro's own usage page (see Tests).
