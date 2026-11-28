# Smoke Test Results

The smoke test from the earlier work's `deployment-strategy.md`, run locally on this machine (Node 22.22.3) for version 1.1.0. The same test runs again in the release workflow on GitHub once the tag is pushed; that run has not happened yet.

| Check | Command | Result |
|---|---|---|
| Package version matches the tag | `test "v$(node -p ...version)" = "v1.1.0"` | OK |
| Tests | `npm test --prefix aidlc-stage-credits` | 53 of 53 pass (see Build and Test) |
| Pack | `npm pack ./aidlc-stage-credits --pack-destination .smoke-release` | `aidlc-stage-credits-1.1.0.tgz`, 10 files |
| Install the tarball into an empty folder | `npm install --prefix .smoke-release ./.smoke-release/aidlc-stage-credits-1.1.0.tgz` | added 1 package, 0 vulnerabilities |
| Installed command runs | `.smoke-release/node_modules/.bin/aidlc-stage-credits --help` | exit 0; usage lists `report [--intent <name>]...`, `export` and `combine` |

**Verdict:** pass. The scratch folder `.smoke-release` was removed afterwards.

## Real-Data Check

- `aidlc-stage-credits` from the project root (Build and Test): 3 intents, 61 credit records, total 333.610 credits; `--intent` narrowing and the unknown-intent message behave as designed.
