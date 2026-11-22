# Deployment Strategy

## Strategy

A tagged, tested, approved release of a command line package. This is not a rolling, blue-green or canary deployment: the package is not a running service, each person installs a specific version when they choose to, and nothing changes for anyone until they run the install command. The strategy is therefore "versioned release, install on demand".

## Versioning

- Semantic version in `aidlc-stage-credits/package.json`; the git tag is `v` plus that version (for example `v1.0.1`).
- The first tag is `v1.0.0`, the version the package has today.
- Format changes to export files raise `format_version` inside the tool (a version-1 tool refuses a newer export); that is separate from the package version.

## Release Steps

1. Change `version` in `aidlc-stage-credits/package.json`, run the tests, merge.
2. Push the tag `v<version>`.
3. The test job runs (version check, then `npm test` on Node 22).
4. The release job waits for the reviewer's approval in GitHub (the `release` environment).
5. After approval it packs the package, smoke tests the tarball, and creates the GitHub release with the tarball.
6. People install with `npm install -g github:<owner>/<repo>#v<version>`.

## Promotion Gates

See `cd-config.md`: version check, tests, manual approval, smoke test.

## Smoke Test (the health check)

- What: install the freshly packed tarball into an empty temporary folder and run `aidlc-stage-credits --help`.
- Pass: exit code 0 and the usage lists `report`, `export` and `combine`.
- Fail: the release is not created; the tag stays and can be deleted or moved after a fix (see `rollback-runbook.md`).

## Abort Conditions

- The tag does not match the package version.
- Any test fails.
- The reviewer rejects or does not approve the release.
- The smoke test fails.
