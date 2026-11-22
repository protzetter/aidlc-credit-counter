# Rollback Runbook

## When to Roll Back

- A release was created and people report that `report`, `export` or `combine` gives wrong figures or fails.
- The smoke test passed but the package breaks on a real project.

## Who

The person who approved the release, with whoever maintains the repository. There is no on-call rota for this tool; contact the repository's maintainers listed in its settings.

## Steps

1. **Tell the team** which version is bad and which is the last good one (for example `v1.0.0`), in the team's usual channel.
2. **People go back** by reinstalling the last good tag: `npm install -g github:<owner>/<repo>#v1.0.0`. Nothing is stored outside the installed copy, so no data needs restoring.
3. **Mark the bad release** in GitHub as a pre-release, or edit its notes with "do not use; use v1.0.0", so nobody picks it up. Do not delete the tag if anyone installed from it: a deleted tag breaks reinstalls.
4. **Export files** written by the bad version: a version-1 tool still reads format version 1 exports. If the bad version wrote wrong figures, tell people to export again with the good version, because the combined report uses only the newest export per person and intent.
5. **Fix forward**: correct the problem, raise the version (for example `v1.0.2`), and release through the normal pipeline, including the approval.

## Checks After Rolling Back

- `aidlc-stage-credits --help` prints the three actions.
- A report on a project with Kiro sessions prints the stage table with no error.

## Not Covered

- Credits already shared in exports from the bad version are not changed by a rollback; step 4 covers them.
- Rolling back from a failed pipeline run (before a release exists) needs no steps: no release was created, and the tag can be deleted and pushed again after the fix.
