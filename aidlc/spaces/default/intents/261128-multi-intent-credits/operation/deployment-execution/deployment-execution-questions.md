# Deployment Execution Questions

Context: no Deployment Pipeline was designed for this intent; the release pipeline from the earlier work (`.github/workflows/release.yml`: a `v*` tag runs the tests, waits for a reviewer's approval in the `release` environment, smoke tests the tarball and creates the GitHub release) is used as it is. The project now has a GitHub remote (`origin`, `https://github.com/protzetter/aidlc-credit-counter.git`) and no tags at all, so version 1.0.0 was never tagged. This change makes the package version 1.1.0. There are no databases, migrations, dependent services or deployment window.

## Q1. [Release] How should version 1.1.0 go out?

Why asked: no `v1.0.0` tag exists, so 1.1.0 would be the first release on GitHub, and pushing and tagging change a shared system, which I will not do for you.

A. I commit this change on `main`, create the tag `v1.1.0` locally, and give you the push commands to run yourself; 1.1.0 is the first release and 1.0.0 is never released
B. I commit this change on `main` only and leave the tag and the push to you
C. Not yet defined
X. Other (please specify)

[Answer]: A
