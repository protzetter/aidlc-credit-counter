## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-22T10:36:36Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261122-credit-counter-industria/construction/functional-design/rules.md > BR3.1, BR3.2, BR3.3, BR3.4 (trigger and logic) versus BR6.1; functional-spec.md > Workflows > Export step 2 | The export command is defined two ways. BR6.1 and the Command Line table say `aidlc-stage-credits export <file> [--person] [--force]`, an action with a positional file. BR3.1, BR3.2 and BR3.3 (trigger `--export <file>`, "IF --export is absent") and Export step 2 ("when `--export` has no .json or .csv ending") describe an `--export` option. A developer cannot tell which command line to build, and the "export not requested" test in BR3.1 and BR8.1 has no clear meaning under the action form. | Pick one form (the action form fits BR6.1 and the Command Line table). Reword BR3.1 to BR3.4 triggers and Export step 2 to match, and say how "no export requested" is told apart from a plain report run. | New |
| R-02 | Major | rules.md > BR4.2 (definition of "unusable"); entities.md > ENT-005 constraints | The list of unusable files omits constraints the design sets on an export. Nothing says what happens to a file with an unparseable `exported_at` (BR4.1 needs it to pick the newest), an empty or blank `person`, duplicate stage names in one export, a negative or non-number `outside`, or a stage name that equals the "outside a stage" label. BR4.2 names only a negative or non-number credit figure. Q4 says one bad file must not silently change the team total, and these cases would. | Make BR4.2 list every ENT-005 constraint as a reason to skip: valid `exported_at`, non-empty trimmed `person`, valid non-negative `outside`, unique stage names, and a non-reserved stage name. Alternatively, state that each such file is accepted and say how. | New |
| R-03 | Major | rules.md > BR5.1; functional-spec.md > Repeatable Figure Check; entities.md > Summary | BR5.1 and the spec say the test data holds "only timestamps and credit values", and a test fails on any other field. The figure check needs per-stage figures (BR5.2), so the data also needs stage windows, which carry stage names. It also needs the `expected` file of hand-recorded totals. Q3 allows only timestamps and credit values in the records. As written, the scan test contradicts the per-stage check, or its scope is undefined. | State exactly what the scan covers (records: timestamp and credit value only; windows: stage name, start and end; expected file: stage names and totals) and what it fails on. Record that stage names are allowed, since Q3 does not say so. | New |
| R-04 | Minor | functional-spec.md > Error Handling table versus rules.md > BR3.2, BR3.3, BR6.1, BR4.3 | The error table omits cases the rules define with exit 1: an export name with a wrong ending (BR3.2), an empty person name (BR3.3), an unknown action (BR6.1), and the exit 2 case where every combine file is unusable (BR4.3). The Command Line table gives combine exit 1 only for "no files". | Add those rows to the table and make the exit-code column match BR3.2, BR3.3, BR4.3 and BR6.1. | New |
| R-05 | Minor | functional-spec.md > Export File Format; entities.md > ENT-005 | The CSV layout uses a pseudo-stage row named `outside a stage`, so it cannot be told apart from a real stage of that name. The CSV rules do not cover quoting of person or intent text that holds a comma, a quote or a line break. The claim that both formats "read back to the same data" is therefore untestable. The JSON example shows credits at 3 decimals, but nothing says whether exported credits are rounded. Rounded per-stage figures could add up to a total that differs from BR2.2 and BR4.4. | Define CSV quoting and the way the outside row is marked. State the credit precision in an export and whether team totals sum rounded or full values. | New |
| R-06 | Minor | entities.md > ENT-007 rows; functional-spec.md > Combine step 3 | `rows` is typed "list of stage and person and credits" with no structure. The order of stages and the handling of a person with no credits in a stage (blank or 0.000) are undefined, so the combined output cannot be tested. | Define the row shape and the ordering. Say how a stage missing for one person is shown. | New |
| R-07 | Minor | rules.md > BR6.2, BR6.3, BR7.1 logic fields | The design is not fully technology-agnostic. BR6.3 prescribes "each action is a function taking its folders", BR6.2 names `package.json` fields, and BR7.1 names the job steps. This is implementation detail, although it stems from FR1, FR6.1 and FR7. | Keep the behaviours (testable with explicit folders, version and Node floor declared, CI runs the tests). Move the mechanism to code generation. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Manual cross-check of traceability.json targets against rules.md | PASS | Every BRx.y target in `coverage` and `reverse` exists in rules.md. FR1.1 to FR7 are all covered, and NFR1 and NFR2 map to BR2.2, BR3.1 and BR8.1. |
| Manual check of "exists today" claims against src/lib.mjs and src/credits-by-stage.mjs | PASS | CreditRecord, StageWindow and the stage totals match the code. The skip behaviours in BR2.1 match the try/catch handling. BR1.1, BR1.4 and the project-root search are new, as stated. |
| Manual check of Q1 to Q4 against the artifacts | PASS with the findings above | Q1 (BR4.1), Q2 (BR3.3), Q3 (BR3.4 and ExportFile) and Q4 (BR4.2) are reflected. The gaps are the BR5.1 scope and the BR4.2 completeness. |

### Summary

The coverage and traceability are sound, and the four answers are honoured. The CLI contract contradicts itself on `--export` versus the `export` action, the combine rule for unusable files leaves holes against the entity constraints, and the test-data rule conflicts with the per-stage check. These are three Major findings, so the design is NOT-READY until they are fixed.
