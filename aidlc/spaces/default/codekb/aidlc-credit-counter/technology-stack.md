# Technology Stack

| Item | Value | Note |
|---|---|---|
| Language | JavaScript (ES modules, `.mjs`) | `"type": "module"` |
| Runtime | Node.js >= 22 | `engines.node` in package.json; CI uses Node 22 |
| Test | `node:test`, `node:assert/strict` | built in; `npm test` = `node --test`; 41 cases; no coverage tool |
| Build | none | |
| Lint/format | none found | |
| CI | GitHub Actions: `.github/workflows/test.yml` (npm test on Node 22), `release.yml` (not scanned) | |
| Third-party packages | none | no lockfile, no `node_modules` |
| Data sources | Kiro session files (`~/.kiro/sessions`), AI-DLC audit markdown and intent files | local files only |
| Version control | git (head `3909d77`) | an earlier note of "no git" is outdated |

Dependency detail: dependencies.md.
