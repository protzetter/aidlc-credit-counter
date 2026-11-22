# aidlc-credit-counter

A small Kiro skill and CLI that reports how many Kiro credits each AI-DLC stage used. It reads Kiro's own session records and the AI-DLC audit trail, and attributes credits to stages by timestamp. No dependencies, Node 22 or newer.

The tool lives in [`aidlc-stage-credits/`](aidlc-stage-credits/README.md). This repository was built with AI-DLC, so it also holds the workflow record in `aidlc/`.

## Quick start

From inside a project that uses AI-DLC:

```
node aidlc-stage-credits/bin/aidlc-stage-credits.mjs
```

Or install the command globally:

```
npm install -g ./aidlc-stage-credits
aidlc-stage-credits
```

## Commands

| Command | What it does |
|---------|--------------|
| `aidlc-stage-credits [report]` | Prints credits per stage for the active intent. Writes nothing. |
| `aidlc-stage-credits export <file.json\|file.csv>` | Prints the table and writes your figures to a file. |
| `aidlc-stage-credits combine <file>...` | Merges exports from several people into a team report. |

See the [package README](aidlc-stage-credits/README.md) for options, export format, exit codes and known limits.

## Repository layout

```
aidlc-stage-credits/   the tool: bin/, src/, test/, SKILL.md
aidlc/                 AI-DLC workflow record (decisions, reviews, audit)
.github/workflows/     test.yml (tests on push and PR), release.yml (tagged releases)
OUTCOMES.md            summary of what the AI-DLC run delivered
AGENTS.md              AI-DLC onboarding for agents
```

## Tests

```
cd aidlc-stage-credits
npm test
```

## Releases

Pushing a tag like `v1.0.0` runs the tests, checks that the tag matches the `package.json` version, and, after a reviewer approves the `release` environment, publishes a packed tarball as a GitHub release.

## Limits

The tool depends on Kiro's session file format, which is not a documented interface. Credits outside a stage window show on an "outside a stage" line. More in the [package README](aidlc-stage-credits/README.md#known-limits).

## License

See [LICENSE](LICENSE).
