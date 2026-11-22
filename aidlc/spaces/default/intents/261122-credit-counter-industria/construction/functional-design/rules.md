# Business Rules

```yaml
rules:
  - id: BR1.1
    statement: The active space is read from aidlc/active-space in the project root; when that file is missing or blank the space is "default".
    category: policy
    applies_to: ProjectContext
    trigger: every run
    logic: IF aidlc/active-space is readable and not blank THEN space = its trimmed text ELSE space = "default"
    violation: none (a fallback)
    source: FR2.1
  - id: BR1.2
    statement: The active intent is read from the "active-intent" file of the active space; a missing or blank file stops the run.
    category: validation
    applies_to: ProjectContext
    trigger: every run
    logic: IF the file is missing or blank THEN stop with message "No active AI-DLC intent found at <path>." and exit code 1
    violation: message and exit code 1
    source: FR2.1
  - id: BR1.3
    statement: The project root is the nearest folder, starting at the current folder and going up, that contains an "aidlc" folder.
    category: policy
    applies_to: ProjectContext
    trigger: every run
    logic: IF no such folder exists THEN stop with message "No AI-DLC project found at or above <current folder>." and exit code 1
    violation: message and exit code 1
    source: FR2.2
  - id: BR1.4
    statement: Kiro sessions are matched to the project by the project root path, not by the current folder.
    category: constraint
    applies_to: CreditRecord
    trigger: finding sessions
    logic: a session counts when one of its workspace paths equals the project root (trailing slash ignored)
    violation: none
    source: FR2.2
  - id: BR2.1
    statement: The report run stops with an error message and exit code 1 when its inputs are missing, and skips unusable single files without stopping.
    category: validation
    applies_to: RunReport
    trigger: report and export
    logic: |
      no Kiro sessions folder -> stop, "No Kiro data found: <folder> does not exist."
      no audit file for the active intent -> stop, "No audit file found in <folder>."
      no session for the project -> stop, "No Kiro sessions found for <project> in <folder>."
      session.json unreadable -> skip that session, continue
      messages file unreadable or missing -> skip that session, continue
      a line in a messages file that cannot be read -> skip that line, continue
    violation: as stated per case
    source: FR6.2
  - id: BR2.2
    statement: The total of a run equals the sum of every stage's credits plus the credits outside any stage, to 3 decimals.
    category: constraint
    applies_to: RunReport
    trigger: every run
    logic: total = sum(stage credits) + outside; no credit is lost or invented
    violation: a failed test (FR5)
    source: NFR1
  - id: BR3.1
    statement: Only the export action writes a file, the one the person names; report and combine write nothing, and nothing else is created or changed.
    category: constraint
    applies_to: ExportFile
    trigger: export action
    logic: IF the action is report or combine THEN no file is written anywhere. IF the action is export and the named file already exists and --force is absent THEN stop with message "<file> exists; use --force to replace it." and exit code 1
    violation: message and exit code 1
    source: NFR2
  - id: BR3.2
    statement: The export format follows the file name ending (.json or .csv); any other ending stops the run.
    category: validation
    applies_to: ExportFile
    trigger: export action
    logic: IF the name does not end in .json or .csv THEN stop with message "Export file must end in .json or .csv." and exit code 1
    violation: message and exit code 1
    source: FR3.1
  - id: BR3.3
    statement: The person in an export is the --person value, trimmed; when it is left out it is the computer's user name; an empty name stops the run.
    category: policy
    applies_to: ExportFile
    trigger: export action
    logic: person = trimmed --person, else operating-system user name; IF empty THEN stop with message "Person name is empty." and exit code 1
    violation: message and exit code 1
    source: FR3.2
  - id: BR3.4
    statement: An export holds only the fields of ExportFile, with credits at full precision (no rounding); rounding to 3 decimals happens only when printing.
    category: constraint
    applies_to: ExportFile
    trigger: export action
    logic: write format_version, tool_version, person, intent, exported_at, each stage with its credits, and outside; nothing else. CSV follows BR3.5
    violation: a failed test
    source: FR3.2
  - id: BR3.5
    statement: A CSV export has the columns format_version, tool_version, person, intent, exported_at, kind, stage, credits; one row per stage with kind "stage", and one last row with kind "outside" and an empty stage.
    category: constraint
    applies_to: ExportFile
    trigger: export action with a .csv name
    logic: a field that holds a comma, a double quote or a line break is wrapped in double quotes with inner quotes doubled; reading a CSV or JSON export back gives the same data as was written
    violation: a failed test
    source: FR3.2
  - id: BR4.1
    statement: When combining, for each person and intent only the newest export (by exported_at) counts; the others are listed as ignored.
    category: policy
    applies_to: CombinedReport
    trigger: combine
    logic: group usable exports by (person, intent); keep the one with the latest exported_at; on a tie keep the file whose path sorts last; list each other file in "ignored" with the file it lost to
    violation: none
    source: FR4
  - id: BR4.2
    statement: A file that cannot be used is skipped with a warning naming it and the reason, and the run ends with exit code 2 after printing the report.
    category: validation
    applies_to: CombinedReport
    trigger: combine
    logic: |
      a file is unusable when it is unreadable or empty, is not valid JSON or CSV, or breaks any ExportFile constraint:
      a required field is missing; format_version is greater than this tool reads;
      exported_at is not a valid time; person is empty after trimming; intent is empty;
      a credit figure (stage or outside) is not a number or is negative;
      two stages share a name; a stage is named like the outside row; there is no stage row at all
    violation: warning on screen and exit code 2
    source: FR4
  - id: BR4.3
    statement: Combining with no usable export stops the run.
    category: validation
    applies_to: CombinedReport
    trigger: combine
    logic: IF no file was given THEN stop with message "No export files given." and exit code 1. IF every file was unusable THEN print the warnings and stop with exit code 2
    violation: message and exit code 1 or 2
    source: FR4
  - id: BR4.4
    statement: Intents are never mixed: each intent has its own section, and a team total is the sum of the kept exports' totals for that intent only, computed from full-precision values and rounded to 3 decimals when printed.
    category: calculation
    applies_to: IntentSection
    trigger: combine
    logic: team_total(intent) = sum over kept exports of (sum of their stage credits + outside)
    violation: a failed test
    source: FR4
  - id: BR4.5
    statement: Person names are compared exactly after trimming; "Ana" and "ana" are two people.
    category: policy
    applies_to: CombinedReport
    trigger: combine
    logic: no case folding and no matching of similar names
    violation: none
    source: FR4
  - id: BR4.6
    statement: In an intent section each row is a stage, a person and credits. Stages come in the order they first appear when the kept exports are read by person name (a to z) and each export's stages in their exported order, with "outside a stage" last. Within a stage the people are listed a to z. A person with no row for a stage shows 0.000.
    category: policy
    applies_to: IntentSection
    trigger: combine
    logic: ordering and filling as stated, so the same exports always print the same report
    violation: a failed test
    source: FR4
  - id: BR5.1
    statement: The figure check's test data holds only what the check needs and no private detail. Credit records carry a timestamp and a credit value only. Stage windows carry the stage name, start and end. The expected-figures file carries stage names and totals recorded by hand from Kiro's usage page. Stage names are AI-DLC stage names, not private data.
    category: constraint
    applies_to: CreditRecord
    trigger: building test data
    logic: remove paths, session ids, project names, user names, prompts and tool names; a test scans each data file and fails when a record holds any field other than timestamp and credits, a window any field other than stage, start and end, or the expected file any field other than stage names and totals
    violation: a failed test
    source: FR5.1
  - id: BR5.2
    statement: The figure check compares the tool's total and per-stage figures with the recorded ones at 3 decimals, and fails on any difference.
    category: validation
    applies_to: RunReport
    trigger: tests
    logic: format both to 3 decimals and compare as text
    violation: a failed test
    source: FR5.2
  - id: BR6.1
    statement: The package installs one command with three actions: report (the default), export and combine.
    category: policy
    applies_to: package
    trigger: install
    logic: aidlc-stage-credits [report] | aidlc-stage-credits export <file> [--person <name>] [--force] | aidlc-stage-credits combine <file>...
    violation: unknown action stops with a usage message and exit code 1
    source: FR1.1
  - id: BR6.2
    statement: The package declares a version number and the minimum Node version (22), and includes the skill file and the README.
    category: constraint
    applies_to: package
    trigger: install
    logic: the package description states its version and that Node 22 or newer is needed, and the installed package holds SKILL.md and README.md
    violation: install refuses or a package check fails
    source: FR1.2
  - id: BR6.3
    statement: Every action can be run in tests with explicit folders (Kiro sessions folder, project root, output file) without touching the real home folder; only the outermost command layer reads options and ends the process.
    category: constraint
    applies_to: all actions
    trigger: tests
    logic: an action takes its folders and options as input and returns its output text and exit code
    violation: a failed test
    source: FR6.1
  - id: BR7.1
    statement: CI runs the tests with Node 22 on every push and pull request, and a failed test fails the CI run.
    category: policy
    applies_to: workflow
    trigger: push, pull request
    logic: the CI service named in the requirements (GitHub Actions) starts a run for each push and pull request that runs the tests
    violation: a failed CI run
    source: FR7
  - id: BR8.1
    statement: Apart from an export the person asked for, the tool only reads files.
    category: constraint
    applies_to: all actions
    trigger: every run
    logic: no write, rename or delete happens except the export file named in BR3.1
    violation: a failed test
    source: NFR2
```

## Rules Summary

| Rule | In short | Source |
|---|---|---|
| BR1.1 to BR1.4 | Find the space, intent and project root; match sessions to the project root | FR2.1, FR2.2 |
| BR2.1, BR2.2 | Which problems stop a run and which are skipped; totals add up | FR6.2, NFR1 |
| BR3.1 to BR3.5 | Export: only the export action writes, .json or .csv, person name, fixed fields, CSV layout | FR3.1, FR3.2, NFR2 |
| BR4.1 to BR4.6 | Combine: newest export wins, bad files skipped, intents kept apart, fixed row order | FR4 |
| BR5.1, BR5.2 | Anonymized test data and an exact figure check | FR5.1, FR5.2 |
| BR6.1 to BR6.3 | One command, three actions; version, Node 22, skill file; logic callable with explicit folders | FR1.1, FR1.2, FR1.3, FR6.1 |
| BR7.1 | CI on every push and pull request | FR7 |
| BR8.1 | Read-only apart from the export | NFR2 |
