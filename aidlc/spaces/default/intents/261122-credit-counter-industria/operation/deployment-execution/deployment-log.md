# Deployment Log

Release v1.0.0 of `aidlc-stage-credits`. It follows the approved pipeline in `cd-config.md` and the steps in `deployment-strategy.md`, and the person's answer in `deployment-execution-questions.md` (Q1: the person creates the GitHub repository and the `release` environment; I set up git, add the release workflow, commit, and give the push and tag commands). Inputs: Build and Test results in `test-results.md` (40 of 40 passing at that stage).

## Fix Before Release

- The person ran the installed command and got all zeros. Cause: this chat's Kiro session keeps the old folder path under `workspacePaths` and lists the renamed path only under `rootPaths`, and the tool matched `workspacePaths` only.
- Fixed in `aidlc-stage-credits/src/project.mjs`: a session matches when the project root is in `workspacePaths` or `rootPaths`. Test added in `aidlc-stage-credits/test/project.test.mjs`.
- The person chose to fix this directly, so the change had no code plan or review. After the fix the real report shows 48 credit records and 257.395 credits.

## Steps Done Here

| Step | Result |
|---|---|
| Add `.github/workflows/release.yml` from the approved definition | done |
| Version check: package version against tag `v1.0.0` | OK |
| Tests: `npm test` in `aidlc-stage-credits/` | 41 of 41 pass |
| Pack: `npm pack` into a scratch folder | `aidlc-stage-credits-1.0.0.tgz` |
| Smoke test: install the tarball into a scratch folder, run `aidlc-stage-credits --help` | exit 0, lists report, export, combine (see `smoke-test-results.md`) |
| Remove the scratch folder | done; no tarball left in the project |
| `git init -b main` and the first commit | done (see below) |

## Steps Left for the Person

These need a GitHub repository, which does not exist yet. Nothing was pushed or created on GitHub.

1. Create an empty GitHub repository (no README, no license, so the first push is clean).
2. In its settings, add an environment named `release` with at least one required reviewer.
3. In this folder, run:

```
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

4. The tag starts the release workflow: the test job runs, then the release job waits for the reviewer's approval in GitHub, smoke tests the tarball and creates the release `v1.0.0`.
5. People install with `npm install -g github:<owner>/<repo>#v1.0.0`. The package sits in the `aidlc-stage-credits/` folder of the repository, not at its root, so installing from the release's tarball is the reliable way: `npm install -g <URL of aidlc-stage-credits-1.0.0.tgz from the release page>`.

## Database Migrations

None: the tool has no database.

## Rollback

See `rollback-runbook.md` in the Deployment Pipeline record. For this first release there is no earlier version to go back to.
