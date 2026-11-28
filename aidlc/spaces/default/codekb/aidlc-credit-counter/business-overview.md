# Business Overview

## Purpose
`aidlc-stage-credits` shows how many Kiro credits each AI-DLC stage consumed, so a person running an AI-DLC workflow can see where the credits went. The first version was a proof of concept (scope `poc`, see OUTCOMES.md at the project root); the current version is a packaged command-line tool (`bin` entry, version 1.0.0) with three actions.

## Business Context
- Credits come from Kiro's own `usage_summary` session records; success is an exact match with Kiro's usage figures (figures test on anonymized real records).
- A person sees their own run on screen (`report`), can write it to a JSON or CSV file (`export`), and a team lead can merge several people's exports into one team table per intent (`combine`).
- Today a report covers ONE intent: the active one. This project already holds three intents (two complete, one in-flight), so the credits of earlier intents are visible only by switching the active intent. Adding a view across intents is the open need (intent `multi-intent-credits`).

## Key Functionality
1. Find the project (nearest folder with `aidlc/`), its active space and active intent.
2. Find the project's sessions in `~/.kiro/sessions` and read their credit records.
3. Read stage start/complete windows from the active intent's audit files.
4. Attribute each credit record to the stage window containing its timestamp; the rest goes on an "outside a stage" line.
5. Print a table (stage, credits to 3 decimals, outside line, total); `export` also writes a file; `combine` prints a per-intent, per-person table.
6. `SKILL.md` tells Kiro to run the tool at each stage gate and on request.

Components: see component-inventory.md. Intent handling and gaps: see code-quality-assessment.md.
