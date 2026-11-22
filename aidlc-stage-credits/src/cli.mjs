// Command-line layer: reads the action and options, calls the actions, returns what to print and
// the exit code. `bin/aidlc-stage-credits.mjs` prints it and ends the process (BR6.1, BR6.3).
import { readFileSync } from 'node:fs';
import { runCombine, runExport, runReport } from './actions.mjs';

/** Usage text shown for an unknown action or a bad option. */
export const USAGE = [
  'Usage:',
  '  aidlc-stage-credits [report]',
  '  aidlc-stage-credits export <file.json|file.csv> [--person <name>] [--force]',
  '  aidlc-stage-credits combine <file>...',
].join('\n');

/** The package version from package.json. */
export function toolVersion() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

const usageError = (message) => ({
  stdout: '',
  stderr: message ? `${message}\n${USAGE}` : USAGE,
  exitCode: 1,
});

/**
 * Run the command line.
 * @param {string[]} argv arguments after the program name
 * @param {{cwd:string, sessionsRoot:string, now?:number, defaultPerson?:string, toolVersion?:string}} env
 * @returns {{stdout:string, stderr:string, exitCode:number}}
 */
export function main(argv, env) {
  const [action = 'report', ...rest] = argv;
  if (action === '--help' || action === '-h') return { stdout: USAGE, stderr: '', exitCode: 0 };
  const common = { startDir: env.cwd, sessionsRoot: env.sessionsRoot, now: env.now };

  if (action === 'report') {
    if (rest.length > 0) return usageError(`Unexpected argument: ${rest[0]}`);
    return runReport(common);
  }

  if (action === 'export') {
    let person;
    let force = false;
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (a === '--force') force = true;
      else if (a === '--person') {
        if (i + 1 >= rest.length) return usageError('--person needs a name.');
        person = rest[++i];
      } else if (a.startsWith('--person=')) person = a.slice('--person='.length);
      else if (a.startsWith('--')) return usageError(`Unknown option: ${a}`);
      else positional.push(a);
    }
    if (positional.length !== 1) return usageError('export needs exactly one file name.');
    return runExport({
      ...common,
      file: positional[0],
      person,
      force,
      toolVersion: env.toolVersion ?? toolVersion(),
      defaultPerson: env.defaultPerson,
    });
  }

  if (action === 'combine') {
    const bad = rest.find((a) => a.startsWith('--'));
    if (bad) return usageError(`Unknown option: ${bad}`);
    return runCombine({ startDir: env.cwd, files: rest });
  }

  return usageError(`Unknown action: ${action}`);
}
