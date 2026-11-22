# Requirements

## Intent Analysis

The goal is a Kiro extension that tells team members how many Kiro credits each AI-DLC stage used, while a run is going, so the team can keep credit costs under control. Source: `intent-statement.md` (ideation/intent-capture), whose Success Metrics, Target Customer and Initiative Trigger sections this document builds on. The workflow scope is `poc`: the aim is to prove the idea works.

## Functional Requirements

- **FR1** The extension reports Kiro credits used per AI-DLC stage.
  - **FR1.1** It reads the credit figures from Kiro's own usage or credit data, if that data can be read locally (for example from session logs) (Q1).
  - **FR1.2** It attributes credits to the AI-DLC stage that was running when they were used.
  - Acceptance: Given a finished AI-DLC run, when the extension is asked for credits, then it lists each stage with its credit figure.
- **FR2** The extension shows per-stage credits live or at each stage gate while a run is going (intent-statement Success Metrics).
  - Acceptance: Given a run in progress, when a stage gate is reached, then the credits for that stage are shown.
- **FR3** The credits are shown on screen to the person who ran the workflow, for their own run only (Q3).
  - Acceptance: Given two people each with their own run, when each asks for credits, then each sees only their own run.
- **FR4** The extension is delivered as a packaged, installable Kiro extension that can be shared across projects (Q4).
  - Acceptance: Given a second project, when the extension is installed there, then FR1 to FR3 work without changes to the extension.

## Non-Functional Requirements

- **NFR1** Accuracy: the per-stage credit figures equal what Kiro itself reports (Q2).
  - Acceptance: Given a stage with a credit figure in Kiro's own report, when the extension reports that stage, then the two figures are equal.

## Constraints

- The extension runs on Kiro only; credit data is limited to what Kiro exposes (Q1).
- The workflow plan is `poc`, with minimal depth and minimal testing (intent-statement Initial Scope Signal).

## Assumptions

- Kiro exposes enough local data to attribute credits to a stage at all. Rationale: FR1.1 and NFR1 depend on it; the proof of concept must test it first.
- Credits can be matched to the stage that was running at that time, for example by time. Rationale: FR1.2 depends on it.

## Out of Scope

- Nothing has been ruled out of the first version yet (Q4 of intent capture).
- Sharing results with the team lead through a report file was not chosen (Q3).

## Open Questions

- Is the data that Kiro exposes detailed enough to meet NFR1 (exact figures)? If not, NFR1 must be relaxed in a later stage.
- Which exact Kiro data source holds the credit figures?
