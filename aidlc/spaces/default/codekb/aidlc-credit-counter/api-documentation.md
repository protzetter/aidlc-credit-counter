# API Documentation

## External: command line
`aidlc-stage-credits [report]`, `aidlc-stage-credits export <file.json|file.csv> [--person <name>] [--force]`, `aidlc-stage-credits combine <file>...`, `--help` / `-h`. From the source tree: `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs`. No environment variables. The project is the nearest folder at or above the current directory that holds `aidlc/`; Kiro data is read from `~/.kiro/sessions`.
- `report` output (stdout): `Intent: <folder name>   Sessions: <n>   Credit records: <n>`, then the table.
- Errors (stderr, exit 1): no project; no sessions folder; no active intent file or blank; no `*.md` in the intent's `audit/`; no session for the project; unknown action or option (usage text); `export`: file not `.json`/`.csv`, empty person, file exists without `--force`, write failure.
- `combine`: exit 2 when any file was skipped (warnings on stderr); exit 1 when no file is named; no report when every file is unusable.
- Auth/network: none.

## External: Kiro skill
`SKILL.md` (name `aidlc-stage-credits`): run the command at each stage gate or on request; show output unchanged; `export` and `combine` only on request; never add `--force` unasked.

## External: export file format (version 1)
JSON object, or CSV with header `format_version,tool_version,person,intent,exported_at,kind,stage,credits` (one `stage` row per stage, one final `outside` row; every row repeats the metadata).
- Fields: `format_version` (integer, must be <= 1), `tool_version`, `person` (trimmed, non-empty), `intent` (non-empty text, the intent folder name), `exported_at` (ISO time), `stages[{stage,credits}]` (at least one, unique names, none named `outside a stage`, credits finite and >= 0), `outside` (finite, >= 0).
- One export file holds exactly one intent and one person. `combine` keeps the newest export per (person, intent) (tie: file path sorting last) and prints one section per intent, sorted by intent text.

## Internal: src exports
| Module | Export | Role |
|---|---|---|
| lib | `OUTSIDE` | `'outside a stage'` |
| lib | `parseStageWindows(auditText, now?)` | `{stage,start,end}[]` sorted by start; open windows end at `now` or the last timestamp |
| lib | `parseCreditRecords(jsonlText)` | `{timestamp,credits}[]` from `usage_summary` lines, unit `credit` only |
| lib | `selectSessions(sessions, projectPath)` | sessions whose `workspacePaths` contain the project (trailing `/` ignored) |
| lib | `attribute(windows, records)` | `{stages, outside, total}`; window with `start <= t < end`, latest start wins |
| lib | `formatReport(totals)` | plain-text table, 3 decimals |
| project | `DEFAULT_SPACE`, `findProjectRoot`, `readActiveSpace`, `intentsDir`, `readActiveIntent`, `readAudit`, `findSessions`, `readCreditRecords`, `folderExists` | read-only data access; `readActiveIntent` returns `{intent, file}`, `readAudit` returns `{dir, text, files}` |
| actions | `runReport`, `runExport`, `runCombine` | return `{stdout, stderr, exitCode}`; only `runExport` writes |
| exportfile | `FORMAT_VERSION`, `CSV_COLUMNS`, `buildExport`, `toJson`, `toCsv`, `csvField`, `serializeExport`, `parseCsvRows`, `exportProblem`, `parseExport` | export build, write, read, validate |
| cli | `USAGE`, `toolVersion`, `main(argv, env)` | argument handling; `env = {cwd, sessionsRoot, now?, defaultPerson?, toolVersion?}` |

## Consumed formats (undocumented by their owners)
- Kiro `messages.jsonl` line: `{timestamp, payload:{type:'usage_summary', promptTurnSummaries:[{unit,usage}]}}`; `session.json`: `{workspacePaths:[...], rootPaths:[...]}`. A session has no intent field.
- AI-DLC audit block: `**Timestamp**: <iso>` / `**Event**: STAGE_STARTED|STAGE_COMPLETED` / `**Stage**: <slug>` on consecutive lines. Audit files are per-clone shards (`audit/<machine-shard>.md`).
- AI-DLC layout: `aidlc/active-space`, `aidlc/spaces/<space>/intents/active-intent` (the intent folder name, e.g. `261128-multi-intent-credits`), `aidlc/spaces/<space>/intents/intents.json` (rows with `uuid`, `slug`, `dirName`, `scope`, `status`, `request`; not read by the tool today).
