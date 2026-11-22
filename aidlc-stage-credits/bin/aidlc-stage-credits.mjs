#!/usr/bin/env node
// Prints Kiro credits per AI-DLC stage for the project at or above the current folder.
// Actions: report (default), export <file>, combine <file>... See README.md.
// This is the only file that prints and ends the process.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { main } from '../src/cli.mjs';

const result = main(process.argv.slice(2), {
  cwd: process.cwd(),
  sessionsRoot: join(homedir(), '.kiro', 'sessions'),
});
if (result.stdout) console.log(result.stdout);
if (result.stderr) console.error(result.stderr);
process.exitCode = result.exitCode;
