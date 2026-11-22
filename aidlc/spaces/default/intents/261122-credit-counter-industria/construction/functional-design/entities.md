# Entities

Design of the data the industrialized tool reads, builds and shares. Source requirements: `requirements.md` (FR2 to FR5, NFR1, NFR2). Existing data shapes come from the code knowledge base (`code-structure.md`, `api-documentation.md`).

```yaml
entities:
  - id: ENT-001
    name: CreditRecord
    description: One Kiro credit figure with the time it was recorded; read from a session's messages file. Exists today.
    attributes:
      - { name: timestamp, type: instant, required: true }
      - { name: credits, type: decimal, required: true, min: 0 }
    relationships: []
  - id: ENT-002
    name: StageWindow
    description: A period during which one AI-DLC stage was running, read from the audit file. Exists today.
    attributes:
      - { name: stage, type: text, required: true }
      - { name: start, type: instant, required: true }
      - { name: end, type: instant, required: true }
    constraints: ["end is not before start"]
    relationships: []
  - id: ENT-003
    name: StageTotal
    description: Credits attributed to one stage, plus the credits that fall in no stage. Exists today.
    attributes:
      - { name: stage, type: text, required: true, unique: true }
      - { name: credits, type: decimal, required: true, min: 0 }
    relationships: []
  - id: ENT-004
    name: RunReport
    description: The result of one run for one person and one intent. Exists today as printed output; it is now also the source of an export.
    attributes:
      - { name: stages, type: list of StageTotal, required: true }
      - { name: outside, type: decimal, required: true, min: 0, description: credits in no stage }
      - { name: total, type: decimal, required: true, min: 0 }
    constraints: ["total equals the sum of every stage's credits plus outside, to 3 decimals"]
    relationships:
      - { to: ENT-003, cardinality: one-to-many, direction: contains }
  - id: ENT-005
    name: ExportFile
    description: A file one person writes to share their run. New. It holds nothing but the fields below.
    attributes:
      - { name: format_version, type: whole number, required: true, defaults: 1 }
      - { name: tool_version, type: text, required: true }
      - { name: person, type: text, required: true, constraints: "trimmed, not empty, compared exactly (case counts)" }
      - { name: intent, type: text, required: true }
      - { name: exported_at, type: instant, required: true }
      - { name: stages, type: list of StageTotal, required: true }
      - { name: outside, type: decimal, required: true, min: 0 }
    constraints:
      - "No other field is written: no paths, session ids, project names, prompts or file contents"
      - "person and intent are not empty after trimming; exported_at is a valid time; every credit figure (stages and outside) is a number of zero or more at full precision"
      - "Stage names are unique within one export, and none is named like the outside row"
      - "A person and an intent together may have several exports; only the newest is used when combining"
    relationships:
      - { to: ENT-003, cardinality: one-to-many, direction: contains }
  - id: ENT-006
    name: CombinedReport
    description: The team result built from several exports. New. Not stored; printed.
    attributes:
      - { name: intents, type: list of IntentSection, required: true }
      - { name: ignored, type: list of text, required: true, description: older exports left out because a newer one exists for the same person and intent }
      - { name: skipped, type: list of text, required: true, description: files that could not be used, with the reason }
    relationships:
      - { to: ENT-005, cardinality: many-to-many, direction: built from }
  - id: ENT-007
    name: IntentSection
    description: One intent's part of a combined report, with credits per stage per person and the team total. New.
    attributes:
      - { name: intent, type: text, required: true, unique: true }
      - { name: rows, type: list of StageRow, required: true, description: "ordered as rule BR4.6 says" }
      - { name: team_total, type: decimal, required: true, min: 0 }
    constraints: ["team_total equals the sum of the kept exports' totals for this intent"]
    relationships:
      - { to: ENT-006, cardinality: many-to-one, direction: belongs to }
      - { to: ENT-009, cardinality: one-to-many, direction: contains }
  - id: ENT-009
    name: StageRow
    description: One line of an intent section. New.
    attributes:
      - { name: stage, type: text, required: true, description: "a stage name, or 'outside a stage'" }
      - { name: person, type: text, required: true }
      - { name: credits, type: decimal, required: true, min: 0, defaults: 0, description: "0 when the person has no figure for the stage" }
    relationships: []
  - id: ENT-008
    name: ProjectContext
    description: Where the tool looks for AI-DLC data. Found at run time, never stored. New (replaces the fixed default space and the current folder).
    attributes:
      - { name: project_root, type: path, required: true, description: nearest folder at or above the current one that holds an aidlc folder }
      - { name: space, type: text, required: true, defaults: default }
      - { name: intent, type: text, required: true }
    relationships: []
```

## Summary

- Four entities exist today and stay as they are (CreditRecord, StageWindow, StageTotal, RunReport).
- Four are new: ExportFile (the only file the tool writes), CombinedReport with IntentSection and StageRow (printed, never stored) and ProjectContext (found at run time).
- Test data for the figure check (requirement FR5) is a set of CreditRecords (timestamp and credits only), StageWindows (stage name, start, end) and an expected-figures file (stage names and totals recorded by hand). It is not a separate entity.
