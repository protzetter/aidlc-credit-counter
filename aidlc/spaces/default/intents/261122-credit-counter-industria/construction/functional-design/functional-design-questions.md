# Functional Design Questions

## Q1. [Product] What should the combined report do when it finds two exports for the same person and the same intent?

Why asked: a person may export a run more than once, and adding both would double count the credits in the team total.

A. Use only the newest export (by its export time) for each person and intent, and say which older one was ignored
B. Stop with an error naming the two files, and ask the person to remove one
C. Add them all up and print a warning
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. [Product] How is a person named in an export?

Why asked: the combined report groups credits per person, but nothing identifies the person yet.

A. By a `--person` name given when exporting; if left out, the computer's user name is used
B. Always by a `--person` name; the export fails when it is missing
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. [Product] What may an export file contain, and what must the test data from real records remove?

Why asked: exports are shared with the team, and the test data is made from real Kiro records.

A. Only: person name, intent, tool and export-format version, export time, credits per stage and the "outside a stage" credits. The test data keeps only timestamps and credit values (no paths, session ids, project names, user names or prompts)
B. The same as A, plus the number of sessions and records counted
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Q4. [Developer] What should the combined report do with an export file it cannot use (unreadable, empty, wrong shape, or from a newer format)?

Why asked: one bad file should not silently change the team total.

A. Skip it, print a warning naming the file, and finish with a non-zero exit so a script notices
B. Stop at once with an error naming the file
C. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
