# Deployment Log

Release 1.1.0 of `aidlc-stage-credits`: the report now covers all intents. No Deployment Pipeline was designed for this intent (it was skipped, because the release pipeline from the earlier work covers it unchanged), so the pipeline used is `.github/workflows/release.yml` as it is. Inputs: Build and Test results (`build-test-results`, the file `test-results.md`; 53 of 53 passing) and the person's answer in `deployment-execution-questions.md` (Q1: commit on `main`, create the tag `v1.1.0` locally, and give the push commands).

## Steps Done Here

| Step | Result |
|---|---|
| Version check: package version against tag `v1.1.0` | OK |
| Tests: `npm test --prefix aidlc-stage-credits` | 53 of 53 pass |
| Pack: `npm pack` into a scratch folder | `aidlc-stage-credits-1.1.0.tgz`, 10 files |
| Smoke test: install the tarball into a scratch folder, run `--help` | exit 0 (see `smoke-test-results.md`) |
| Remove the scratch folder | done; nothing left in the project |
| Commit on `main` | done (see the final line of this file) |
| Tag `v1.1.0` created locally | done |

## Remote State

- `origin` is `https://github.com/protzetter/aidlc-credit-counter.git`. At the start of this stage the project had no tags, so version 1.0.0 was never tagged; 1.1.0 is the first release (the person's choice).
- Nothing was pushed.

## Steps Left for the Person

1. Push the work and the tag:

```
git push origin main
git push origin v1.1.0
```

2. The tag starts the release workflow: the test job runs, then the release job waits for the reviewer's approval in the `release` environment (create it first in the repository's settings if it does not exist yet, with a required reviewer), smoke tests the tarball and creates the release `v1.1.0` with the tarball attached.
3. People install from the tarball attached to the release.

## Database Migrations

None: the tool has no database.

## Rollback

There is no earlier release to go back to. If 1.1.0 turns out to be bad, follow `rollback-runbook.md` in the earlier intent's Deployment Pipeline record: mark the release "do not use" without deleting its tag, and release a fix as 1.1.1.
