---
name: aidlc-stage-credits
description: Shows how many Kiro credits each AI-DLC stage used, read from Kiro's local session data, and can export your figures or combine the exports of a team. Use at each stage gate and whenever the person asks about credit use per stage.
---

# AI-DLC stage credits

Run this from anywhere inside the project, at each stage gate and whenever the person asks how many credits a stage or the workflow used:

```
node aidlc-stage-credits/bin/aidlc-stage-credits.mjs
```

(When the package is installed, the command is `aidlc-stage-credits`.)

Show the output as is: do not reword, round or recompute it. If the command exits with an error message, show that message and stop. The report only reads files and changes nothing.

Two more actions, only when the person asks for them:

- `aidlc-stage-credits export <file.json|file.csv> [--person <name>] [--force]` prints the same report and writes one export file with the person's figures. Never add `--force` unless the person says to replace an existing file.
- `aidlc-stage-credits combine <file>...` reads export files from several people and prints a team report per intent. Exit code 2 means some files were skipped: show the warnings.
