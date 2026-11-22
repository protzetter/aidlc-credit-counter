# Cross-Unit Traceability

**Verdict:** pass. Every requirement is built; none is uncovered. (This work has no Units, so everything belongs to the single stage-level Code Generation.)

| ID | Covered | Owning stage | Target file |
|---|---|---|---|
| FR1.1 | yes | code-generation | `aidlc-stage-credits/bin/aidlc-stage-credits.mjs` |
| FR1.2 | yes | code-generation | `aidlc-stage-credits/package.json` |
| FR1.3 | yes | code-generation | `aidlc-stage-credits/package.json` |
| FR2.1 | yes | code-generation | `aidlc-stage-credits/src/project.mjs` |
| FR2.2 | yes | code-generation | `aidlc-stage-credits/src/project.mjs` |
| FR3.1 | yes | code-generation | `aidlc-stage-credits/src/exportfile.mjs` |
| FR3.2 | yes | code-generation | `aidlc-stage-credits/src/exportfile.mjs` |
| FR4 | yes | code-generation | `aidlc-stage-credits/src/actions.mjs` |
| FR5.1 | yes | code-generation | `aidlc-stage-credits/test/figures.test.mjs` |
| FR5.2 | yes | code-generation | `aidlc-stage-credits/test/figures.test.mjs` |
| FR6.1 | yes | code-generation | `aidlc-stage-credits/src/actions.mjs` |
| FR6.2 | yes | code-generation | `aidlc-stage-credits/test/actions.test.mjs` |
| FR7 | yes (built; the workflow has not run on GitHub) | code-generation | `.github/workflows/test.yml` |
| NFR1 | yes (built and checked: the figure test passes and the person reports a manual match with Kiro's usage page) | code-generation | `aidlc-stage-credits/test/figures.test.mjs` |
| NFR2 | yes | code-generation | `aidlc-stage-credits/test/actions.test.mjs` |

Uncovered elements: none.
