# API Documentation

## External: command line
`node aidlc-stage-credits/src/credits-by-stage.mjs` (also `npm run report` inside the package). No arguments, flags or environment variables. Uses the current directory as the project path.
- Output (stdout): `Intent: <slug>   Sessions: <n>   Credit records: <n>` then the table.
- Errors (stderr, exit 1): no `~/.kiro/sessions`; no `active-intent`; no `*.md` in the intent's `audit/`; no session for the project.
- Auth/network: none.

## External: Kiro skill
`SKILL.md` (name `aidlc-stage-credits`): run the command at each stage gate or on request; show output unchanged; on error show the message and stop.

## Internal: lib.mjs exports
| Export | Input | Output |
|---|---|---|
| `OUTSIDE` | - | `'outside a stage'` |
| `parseStageWindows(auditText, now?)` | audit markdown, epoch ms | `{stage,start,end}[]` sorted by start; open windows end at `now` or last timestamp |
| `parseCreditRecords(jsonlText)` | messages.jsonl text | `{timestamp,credits}[]` from `usage_summary` lines, unit `credit` only |
| `selectSessions(sessions, projectPath)` | `{workspacePaths?}[]` | sessions whose path equals project (trailing `/` ignored) |
| `attribute(windows, records)` | both above | `{stages:{stage,credits}[], outside, total}` |
| `formatReport(totals)` | totals | plain-text table, 3 decimals |

## Consumed formats (undocumented by their owners)
- Kiro `messages.jsonl` line: `{timestamp, payload:{type:'usage_summary', promptTurnSummaries:[{unit,usage}]}}`; `session.json`: `{workspacePaths:[...]}`.
- AI-DLC audit block: `**Timestamp**: <iso>` / `**Event**: STAGE_STARTED|STAGE_COMPLETED` / `**Stage**: <slug>` on consecutive lines.
