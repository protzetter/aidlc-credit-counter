# CD Pipeline Configuration

Delivery of the `aidlc-stage-credits` package. Answers: install from the GitHub repository at a version tag (Q1), a version tag starts a release (Q2), a person approves in GitHub first (Q3), all in `deployment-pipeline-questions.md`. Evidence of what exists: `.github/workflows/test.yml` and `aidlc-stage-credits/package.json` (version 1.0.0, `private`, Node 22 or newer), built in Code Generation and checked in Build and Test. The CI Pipeline and Infrastructure Design stages did not run in this plan, so there are no `ci-config`, `quality-gates`, `infrastructure-specification` or `cicd-pipeline` documents to build on.

## What is Delivered

- The package folder `aidlc-stage-credits/`, installed from the repository at a version tag, for example `npm install -g github:<owner>/<repo>#v1.0.0`. The repository's root holds the project, so the package is one folder inside it; the install command and the folder path are settled in Deployment Execution.
- Nothing is published to a registry (Q1), so `"private": true` stays in `package.json`.
- Each release also carries the tarball `aidlc-stage-credits-<version>.tgz` from `npm pack` as a convenience download.

## Environments and Promotion

There are no environments to promote through: the package is not a running service. The promotion path is two steps.

| Step | What happens | Gate |
|---|---|---|
| 1. Test | The tests run on Node 22 for the tagged commit | all tests pass |
| 2. Release | The GitHub release and tarball are created | a person approves (Q3) |

## Trigger and Gates

- **Trigger (Q2):** pushing a tag that matches `v*` (for example `v1.0.0`).
- **Gate 1, version check:** the tag without its `v` must equal `version` in `aidlc-stage-credits/package.json`. If not, the run stops before releasing.
- **Gate 2, tests:** `npm test` inside `aidlc-stage-credits/` on Node 22 must pass.
- **Gate 3, approval (Q3):** the release job uses a GitHub environment named `release` that requires a reviewer. The job waits until that person approves in GitHub.
- **Gate 4, smoke test:** after packing, install the tarball into a temporary folder and run `aidlc-stage-credits --help`; it must exit 0 and print the three actions. Only then is the release created.

## Pipeline Definition (for Deployment Execution to put in place)

File to create there: `.github/workflows/release.yml`. It is written here as a definition; this stage creates no workflow file.

```yaml
name: release
on:
  push:
    tags: ['v*']
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: aidlc-stage-credits } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: tag matches package version
        run: test "v$(node -p "require('./package.json').version")" = "${GITHUB_REF_NAME}"
      - run: npm test
  release:
    needs: test
    runs-on: ubuntu-latest
    environment: release        # required reviewer set in GitHub
    permissions:
      contents: write           # only this job may create the release
    defaults: { run: { working-directory: aidlc-stage-credits } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm pack
      - name: smoke test the tarball
        run: |
          mkdir ../smoke && cd ../smoke && npm init -y >/dev/null
          npm install ../aidlc-stage-credits/aidlc-stage-credits-*.tgz
          npx aidlc-stage-credits --help
      - run: gh release create "${GITHUB_REF_NAME}" aidlc-stage-credits-*.tgz --generate-notes
        env: { GH_TOKEN: "${{ github.token }}" }
```

## Settings Needed in GitHub (by a person)

- A repository holding the project (none exists yet; the project has no git).
- An environment named `release` with at least one required reviewer.
- Optionally, a rule that only the main branch's maintainers can push `v*` tags.

## Feature Flags

None. A command line tool with one version per tag needs no progressive delivery.

## Security Notes

- No secrets are used: the release step uses the run's own token (`github.token`), limited to `contents: write` in the release job only; the test job has read-only access.
- The package has no runtime dependencies, so nothing is fetched at install time apart from the tarball itself.
- Pinning the third-party actions by commit hash instead of `@v4` is left open; it is a common hardening step for a later change.
