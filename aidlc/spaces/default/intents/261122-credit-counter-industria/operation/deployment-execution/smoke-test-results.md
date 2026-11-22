# Smoke Test Results

The smoke test defined in `deployment-strategy.md`, run locally on this machine (Node 22.22.3) for v1.0.0. The same test runs again in the release workflow on GitHub, once the person pushes the tag; that run has not happened yet.

| Check | Command | Result |
|---|---|---|
| Package version matches the tag | `test "v$(node -p ...version)" = "v1.0.0"` | OK |
| Tests | `npm test --prefix aidlc-stage-credits` | 41 of 41 pass |
| Pack | `npm pack ./aidlc-stage-credits --pack-destination .smoke-release` | `aidlc-stage-credits-1.0.0.tgz` |
| Install the tarball into an empty folder | `npm install --prefix .smoke-release ./.smoke-release/aidlc-stage-credits-1.0.0.tgz` | added 1 package, 0 vulnerabilities |
| Installed command runs | `.smoke-release/node_modules/.bin/aidlc-stage-credits --help` | exit 0; usage lists `report`, `export` and `combine` |

**Verdict:** pass. The scratch folder `.smoke-release` was removed afterwards.

## Real-Data Check (beyond the smoke test)

- `node aidlc-stage-credits/bin/aidlc-stage-credits.mjs report` from the project root, after the session-matching fix: 2 sessions, 48 credit records, total 257.395 credits, with figures for every stage of this work.
- Known limit: the first piece of work ran in the same chat, so its credits appear on the "outside a stage" line (76.478).
