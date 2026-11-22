# Deployment Pipeline Questions

Context: the thing to deliver is the `aidlc-stage-credits` command line package (a folder with a `package.json`, version 1.0.0, kept `private`). There is no server, container or cloud environment, and no CI Pipeline or Infrastructure Design stage ran in this plan; the only existing pipeline is `.github/workflows/test.yml`, which runs the tests. So "deploying" means making a tested, versioned package available to the team.

## Q1. [Release] How will people get the package?

Why asked: this decides what the release step has to produce, and whether the package stays `private`.

A. They install it straight from the GitHub repository at a version tag (for example `npm install -g github:<owner>/<repo>#v1.0.0`); nothing is published to a registry
B. It is published to a private registry (for example GitHub Packages) that the team can read
C. It is published to the public npm registry
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. [Release] What starts a release?

Why asked: a release should happen only after the tests pass, and the person wants to know when it fires.

A. Pushing a version tag such as `v1.0.0`: the workflow runs the tests, and only if they pass creates a GitHub release
B. A person starts it by hand from GitHub ("run workflow"), after the tests pass
C. Every merge to the main branch
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. [Release] Who approves a release before it goes out?

Why asked: the organization's rules ask for a separate manual approval before production; this is a team tool, not production, so the person decides how strict to be.

A. A person approves in GitHub (a protected "release" environment with a required reviewer) before the release is created
B. No extra approval: the tag push is the approval
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
