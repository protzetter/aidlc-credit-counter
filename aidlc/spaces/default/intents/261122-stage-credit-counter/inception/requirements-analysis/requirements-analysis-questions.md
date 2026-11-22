# Requirements Analysis Questions

## Q1. [Developer] Where should the per-stage credit numbers come from?

Why asked: the skill can only count what it can read; this decides what the proof of concept must prove is possible.

A. Kiro's own usage or credit data, if it can be read locally (for example session logs)
B. An estimate worked out from what the AI-DLC audit trail already records (stage start and end times, messages)
C. The user types in the credit figure from Kiro's usage page at each stage
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. [Product] How accurate must the numbers be?

Why asked: the intent review noted that the success measure had no pass/fail threshold.

A. Exactly what Kiro itself reports
B. Within about 10% of what Kiro reports
C. A rough relative ranking of stages is enough (which stage cost most)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. [Product] Who sees the numbers, and how do they reach the team lead?

Why asked: the team lead or budget owner decides what is built, but nothing says how they get the result.

A. Each person sees only their own run on screen
B. The skill also writes a report file in the project that can be shared with the team lead
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Q4. [Developer] What form should the "Kiro extension skill" take?

Why asked: "extension skill" can mean several things in Kiro, and each one changes what gets built.

A. A Kiro skill: a folder with a `SKILL.md` inside the project's `.kiro/skills/`
B. A packaged, installable Kiro extension that can be shared across projects
C. Not yet defined
X. Other (please specify)

[Answer]: B

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
