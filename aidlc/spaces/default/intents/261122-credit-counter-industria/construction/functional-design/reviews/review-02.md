## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-22T10:39:19Z
**Iteration:** 2
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261122-credit-counter-industria/construction/functional-design/rules.md > BR3.1, BR3.2, BR3.3, BR3.4 (trigger and logic) versus BR6.1; functional-spec.md > Workflows > Export step 2 | The export command is defined two ways. BR6.1 and the Command Line table say `aidlc-stage-credits export <file> [--person] [--force]`, an action with a positional file. BR3.1, BR3.2 and BR3.3 (trigger `--export <file>`, "IF --export is absent") and Export step 2 ("when `--export` has no .json or .csv ending") describe an `--export` option. A developer cannot tell which command line to build, and the "export not requested" test in BR3.1 and BR8.1 has no clear meaning under the action form. | Pick one form (the action form fits BR6.1 and the Command Line table). Reword BR3.1 to BR3.4 triggers and Export step 2 to match, and say how "no export requested" is told apart from a plain report run. | Resolved (reviewer) |
| R-02 | Major | rules.md > BR4.2 (definition of "unusable"); entities.md > ENT-005 constraints | The list of unusable files omits constraints the design sets on an export. Nothing says what happens to a file with an unparseable `exported_at` (BR4.1 needs it to pick the newest), an empty or blank `person`, duplicate stage names in one export, a negative or non-number `outside`, or a stage name that equals the "outside a stage" label. BR4.2 names only a negative or non-number credit figure. Q4 says one bad file must not silently change the team total, and these cases would. | Make BR4.2 list every ENT-005 constraint as a reason to skip: valid `exported_at`, non-empty trimmed `person`, valid non-negative `outside`, unique stage names, and a non-reserved stage name. Alternatively, state that each such file is accepted and say how. | Resolved (reviewer) |
| R-03 | Major | rules.md > BR5.1; functional-spec.md > Repeatable Figure Check; entities.md > Summary | BR5.1 and the spec say the test data holds "only timestamps and credit values", and a test fails on any other field. The figure check needs per-stage figures (BR5.2), so the data also needs stage windows, which carry stage names. It also needs the `expected` file of hand-recorded totals. Q3 allows only timestamps and credit values in the records. As written, the scan test contradicts the per-stage check, or its scope is undefined. | State exactly what the scan covers (records: timestamp and credit value only; windows: stage name, start and end; expected file: stage names and totals) and what it fails on. Record that stage names are allowed, since Q3 does not say so. | Resolved (reviewer) |
| R-04 | Minor | functional-spec.md > Error Handling table versus rules.md > BR3.2, BR3.3, BR6.1, BR4.3 | The error table omits cases the rules define with exit 1: an export name with a wrong ending (BR3.2), an empty person name (BR3.3), an unknown action (BR6.1), and the exit 2 case where every combine file is unusable (BR4.3). The Command Line table gives combine exit 1 only for "no files". | Add those rows to the table and make the exit-code column match BR3.2, BR3.3, BR4.3 and BR6.1. | Resolved (reviewer) |
| R-05 | Minor | functional-spec.md > Export File Format; entities.md > ENT-005 | The CSV layout uses a pseudo-stage row named `outside a stage`, so it cannot be told apart from a real stage of that name. The CSV rules do not cover quoting of person or intent text that holds a comma, a quote or a line break. The claim that both formats "read back to the same data" is therefore untestable. The JSON example shows credits at 3 decimals, but nothing says whether exported credits are rounded. Rounded per-stage figures could add up to a total that differs from BR2.2 and BR4.4. | Define CSV quoting and the way the outside row is marked. State the credit precision in an export and whether team totals sum rounded or full values. | Resolved (reviewer) |
| R-06 | Minor | entities.md > ENT-007 rows; functional-spec.md > Combine step 3 | `rows` is typed "list of stage and person and credits" with no structure. The order of stages and the handling of a person with no credits in a stage (blank or 0.000) are undefined, so the combined output cannot be tested. | Define the row shape and the ordering. Say how a stage missing for one person is shown. | Resolved (reviewer) |
| R-07 | Minor | rules.md > BR6.2, BR6.3, BR7.1 logic fields | The design is not fully technology-agnostic. BR6.3 prescribes "each action is a function taking its folders", BR6.2 names `package.json` fields, and BR7.1 names the job steps. This is implementation detail, although it stems from FR1, FR6.1 and FR7. | Keep the behaviours (testable with explicit folders, version and Node floor declared, CI runs the tests). Move the mechanism to code generation. | Resolved (reviewer) |
| R-08 | Minor | aidlc/spaces/default/intents/261122-credit-counter-industria/construction/functional-design/rules.md > BR4.2 and entities.md > ENT-005 | The unusable-file reasons and the ExportFile constraints do not say what happens with an empty stage name, a format_version below 1 or not a whole number, or a CSV whose rows disagree on person, intent or exported_at. A developer would have to guess whether such files are usable. | Add these cases to the ExportFile constraints and to the BR4.2 list as unusable, or state that they are accepted. | New |
| R-09 | Minor | aidlc/spaces/default/intents/261122-credit-counter-industria/construction/functional-design/rules.md > BR4.6 and BR4.4 | The BR4.6 stage ordering rule does not say how a stage name that appears in one person's export but not another's is placed beyond "first appearance", and the text "outside a stage" is a display label that could clash with a real stage of that name. Entity constraints only forbid a stage named like the outside row. | State that the label used in the outside row is the same reserved text in both constraints, so the clash cannot happen. | New |

> R-01 Reviewer note: functional-spec.md Command Line table and BR6.1 now define export only as an action (`export <file> [--person] [--force]`). BR3.1 and BR3.2 use the same wording. No `--export` option remains.

> R-02 Reviewer note: BR4.2 now lists every unusable-file reason from the ExportFile constraints: unreadable or empty, bad JSON or CSV, missing field, newer format_version, bad exported_at, empty person or intent, bad or negative credits, duplicate stage names, a stage named like the outside row, and no stage row.

> R-03 Reviewer note: BR5.1 and the spec's Repeatable Figure Check now allow stage names in the windows and in the expected file. Both limit fields to those the per-stage check needs, and a test enforces this.

> R-04 Reviewer note: The error table and command-line table now cover BR3.2, BR3.3, BR4.3 and BR6.1. Exit codes agree with BR4.3: 1 for no files given, 2 when every file was unusable.

> R-05 Reviewer note: BR3.5 and the spec define the CSV columns, the kind values (stage, outside), the empty stage on the outside row, quoting, and full-precision credits with rounding only when printing (BR3.4).

> R-06 Reviewer note: ENT-009 StageRow and BR4.6 define row shape, ordering (person a to z, outside last) and 0.000 for a missing person.

> R-07 Reviewer note: BR6.2 and BR7.1 are now stated as outcomes. BR6.3 still describes a layering (only the outermost layer reads options), but it is stated as a testability constraint and does not block.

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Manual cross-check of traceability.json | PASS | Every FR target resolves to an existing BR id. The reverse entries BR2.2, BR3.1 and BR8.1 are marked N/A for NFR1 and NFR2. Every BR appears either as a target or in the reverse list. |
| Exit code consistency (spec, rules) | PASS | Exit codes agree across BR2.1, BR3.x, BR4.3 and BR6.1, the command-line table and the error table. |

### Summary

All seven prior findings are fixed. The revision introduced no contradictions between rules.md, entities.md, functional-spec.md and traceability.json. Two minor edge cases are left open. A developer could build from these artifacts without further architectural guidance.
