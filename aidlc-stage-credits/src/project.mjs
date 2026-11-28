// Data access: find the AI-DLC project, its active space and intent, the audit text and the Kiro sessions.
// Read-only. Every function takes its folders as input (no use of the real home folder here).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseCreditRecords, selectSessions } from './lib.mjs';

/** Name of the space used when `aidlc/active-space` is missing or blank. */
export const DEFAULT_SPACE = 'default';

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Nearest folder, starting at `startDir` and going up, that contains an `aidlc` folder (BR1.3).
 * @returns {string|null} the project root, or null when there is none
 */
export function findProjectRoot(startDir) {
  let dir = resolve(startDir);
  for (;;) {
    if (isDir(join(dir, 'aidlc'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function readTrimmed(file) {
  try {
    return readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

/** The active space from `aidlc/active-space`; "default" when missing or blank (BR1.1). */
export function readActiveSpace(projectRoot) {
  return readTrimmed(join(projectRoot, 'aidlc', 'active-space')) || DEFAULT_SPACE;
}

/** Folder holding the intents of a space. */
export function intentsDir(projectRoot, space) {
  return join(projectRoot, 'aidlc', 'spaces', space, 'intents');
}

/**
 * The active intent of a space (BR1.2).
 * @returns {{intent:string, file:string}} `intent` is '' when the file is missing or blank
 */
export function readActiveIntent(projectRoot, space) {
  const file = join(intentsDir(projectRoot, space), 'active-intent');
  return { intent: readTrimmed(file), file };
}

/**
 * Audit markdown of an intent, all its `.md` files joined (sorted by name).
 * @returns {{dir:string, text:string, files:string[]}}
 */
export function readAudit(projectRoot, space, intent) {
  const dir = join(intentsDir(projectRoot, space), intent, 'audit');
  let files = [];
  if (isDir(dir)) {
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
    } catch {
      files = [];
    }
  }
  const parts = [];
  for (const f of files) {
    try {
      parts.push(readFileSync(join(dir, f), 'utf8'));
    } catch {
      // unreadable audit file; skip
    }
  }
  return { dir, text: parts.join('\n---\n'), files };
}

/**
 * The intents of a space, in order: the `dirName` of each entry of `intents.json`; when that file is
 * missing or unreadable, the intent folders (names starting with a dot are skipped), sorted by name.
 * @returns {string[]}
 */
export function listIntents(projectRoot, space) {
  const dir = intentsDir(projectRoot, space);
  try {
    const list = JSON.parse(readFileSync(join(dir, 'intents.json'), 'utf8'));
    if (Array.isArray(list)) {
      const names = [];
      for (const e of list) {
        const n = e && typeof e.dirName === 'string' ? e.dirName.trim() : '';
        if (n !== '' && !names.includes(n)) names.push(n);
      }
      return names;
    }
  } catch {
    // missing or unreadable: fall back to the folders
  }
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Audit text of each named intent. An intent with no audit file goes to `missing`.
 * @returns {{audits:{intent:string,text:string}[], missing:string[]}}
 */
export function readIntentAudits(projectRoot, space, names) {
  const audits = [];
  const missing = [];
  for (const intent of names) {
    const a = readAudit(projectRoot, space, intent);
    if (a.files.length === 0) missing.push(intent);
    else audits.push({ intent, text: a.text });
  }
  return { audits, missing };
}

/**
 * Kiro sessions of this project: `<sessionsRoot>/<workspace>/<session>/session.json` whose
 * `workspacePaths` or `rootPaths` include the project root (BR1.4). Kiro keeps the path a chat
 * started in under `workspacePaths` and adds later paths, such as a renamed project folder, only to
 * `rootPaths`, so both are checked. Unreadable session files are skipped.
 * @returns {{dir:string, workspacePaths:string[]}[]}
 */
export function findSessions(sessionsRoot, projectRoot) {
  const found = [];
  let workspaces = [];
  try {
    workspaces = readdirSync(sessionsRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const ws of workspaces) {
    if (!ws.isDirectory()) continue;
    const wsDir = join(sessionsRoot, ws.name);
    let entries = [];
    try {
      entries = readdirSync(wsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const s of entries) {
      if (!s.isDirectory()) continue;
      try {
        const meta = JSON.parse(readFileSync(join(wsDir, s.name, 'session.json'), 'utf8'));
        const paths = [meta.workspacePaths, meta.rootPaths].flatMap((p) => (Array.isArray(p) ? p : []));
        found.push({ dir: join(wsDir, s.name), workspacePaths: paths });
      } catch {
        // not a readable session; skip
      }
    }
  }
  return selectSessions(found, projectRoot);
}

/**
 * Credit records of the given sessions. A session whose messages file is missing or unreadable is
 * skipped; unreadable lines are skipped by the parser.
 * @returns {{timestamp:number,credits:number}[]}
 */
export function readCreditRecords(sessions) {
  const records = [];
  for (const s of sessions) {
    try {
      records.push(...parseCreditRecords(readFileSync(join(s.dir, 'messages.jsonl'), 'utf8')));
    } catch {
      // session without readable messages; skip
    }
  }
  return records;
}

/** True when the folder exists. */
export function folderExists(p) {
  return existsSync(p);
}
