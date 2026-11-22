# Deployment Execution Questions

Context: the approved pipeline (`cd-config.md`) releases from a GitHub repository when a `v*` tag is pushed, after the tests, a reviewer's approval in a `release` environment and a smoke test. This project has no git repository yet, and no GitHub repository or `release` environment exists, so the pipeline cannot run as designed today. There are no databases, migrations, dependent services or deployment window: the release is a versioned package that people install when they choose.

## Q1. [Release] How should this first release (v1.0.0) go out?

Why asked: the designed path needs a GitHub repository that does not exist yet, and I will not create a remote repository or push code without you.

A. You create the GitHub repository and the `release` environment with a reviewer; I then initialize git here, add `.github/workflows/release.yml`, commit, and give you the exact push and tag commands to run yourself
B. Local release only for now: I add `.github/workflows/release.yml`, run the same checks locally (version, tests, pack, smoke-install the tarball into a scratch folder and run `--help`), and leave the GitHub push for later
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
