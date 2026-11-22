# Requirements Analysis Questions

## Q1. [Developer] What form should the installable package take?

Why asked: the first version is only a folder you copy by hand; the form decides what gets built and how people install and update it.

A. A Kiro skill folder installed globally (in `~/.kiro/skills`), one install for all projects
B. A Kiro Power (a packaged, installable bundle Kiro can add from a source)
C. An npm package that people install and run from the command line, plus the skill file
D. Not yet defined
X. Other (please specify)

[Answer]: C

## Q2. [Product] What should the team view be, given that each person's credit data lives only on their own machine?

Why asked: Kiro's credit records are stored locally per person, so a team total has to be built from what each person shares.

A. Each person exports their own run to a file (CSV or JSON) in the repo or a shared folder, and the team lead combines the files
B. The tool can also read several exported files and print one combined report (per stage, per person, per intent)
C. Not yet defined
X. Other (please specify)

[Answer]: B

## Q3. [Quality] How should the "figures match Kiro" check become repeatable?

Why asked: the first check was one manual comparison with Kiro's usage page, which a machine cannot repeat.

A. Keep a few anonymized copies of real Kiro records as test data and check the script's totals against figures recorded once by hand from Kiro's usage page
B. Only check that the script reads and adds the records correctly (no comparison with Kiro's page), and say so in the documentation
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Q4. [Developer] Where will this code live and run CI?

Why asked: the project has no git yet, and CI needs a place to run.

A. GitHub, with GitHub Actions
B. Another service (GitLab CI, CodePipeline or similar)
C. Not decided yet; build the CI definition for GitHub Actions and adapt later
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q5. [Product] Which known attribution gaps must this version fix?

Why asked: the first version shows credits between stages, in resumed stages and in the running stage on an "outside a stage" line or as 0.000.

A. Only the ones that block the team view: find the active space and intent (not the fixed `default`), and run from any subfolder
B. Also handle re-entry after a rejection or loop-back and show the running stage's credits as soon as they are recorded
C. None; the gaps stay documented limits
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
