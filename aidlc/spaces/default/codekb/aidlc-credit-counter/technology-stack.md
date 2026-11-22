# Technology Stack

| Item | Value | Note |
|---|---|---|
| Language | JavaScript (ES modules, `.mjs`) | `"type": "module"` |
| Runtime | Node.js 22 (22.22.3 per OUTCOMES.md) | no `engines` field in package.json; no Bun on the machine |
| Test | `node:test`, `node:assert/strict` | built in; no coverage tool |
| Build | none | |
| Lint/format | none | |
| CI | none | |
| Third-party packages | none | no lockfile, no `node_modules` |
| Data sources | Kiro session files (`~/.kiro/sessions`), AI-DLC audit markdown | local files only |
| Version control | none (no git repository) | |

Dependency detail: dependencies.md.
