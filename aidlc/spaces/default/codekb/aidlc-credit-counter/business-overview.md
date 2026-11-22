# Business Overview

## Purpose
`aidlc-stage-credits` shows how many Kiro credits each AI-DLC stage consumed, so a person running an AI-DLC workflow can see where the credits went. It was built as a proof of concept (scope `poc`, see OUTCOMES.md at the project root).

## Business Context
- Credits come from Kiro's own `usage_summary` session records; success is an exact match with Kiro's usage figures.
- Each person sees only their own run, on screen. No team view exists yet.
- The requested delivery form was an installable Kiro extension; only a copyable skill folder exists.

## Key Functionality
1. Find sessions of the current project in `~/.kiro/sessions`.
2. Read stage start/complete windows from the active intent's AI-DLC audit file.
3. Attribute each credit record to the stage window containing its timestamp; the rest goes on an "outside a stage" line.
4. Print a table (stage, credits to 3 decimals, outside line, total).
5. The skill (`SKILL.md`) tells Kiro to run the script at each stage gate and on request.

Components: see component-inventory.md. Gaps and next steps: see code-quality-assessment.md.
