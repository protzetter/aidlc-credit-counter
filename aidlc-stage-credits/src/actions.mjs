// The three actions: report, export and combine. Each takes its folders and options and returns
// `{ stdout, stderr, exitCode }`; none prints or ends the process (BR6.3). Only `runExport` writes a
// file, the one the person names (BR3.1, BR8.1).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { resolve } from 'node:path';
import { OUTSIDE, attribute, formatReport, parseStageWindows } from './lib.mjs';
import { buildExport, parseExport, serializeExport } from './exportfile.mjs';
import { attributeIntents, formatIntentsReport } from './intents.mjs';
import {
  findProjectRoot,
  findSessions,
  folderExists,
  intentsDir,
  listIntents,
  readActiveIntent,
  readActiveSpace,
  readAudit,
  readCreditRecords,
  readIntentAudits,
} from './project.mjs';

const fail = (message, exitCode = 1) => ({ stdout: '', stderr: message, exitCode });

/**
 * Steps 1 to 6 of the report workflow: find the project, read the data, add up the credits.
 * @returns {{error:string}|{intent:string,sessionCount:number,recordCount:number,
 *            totals:{stages:{stage:string,credits:number}[],outside:number,total:number}}}
 */
function collectRun({ startDir, sessionsRoot, now }) {
  const root = findProjectRoot(startDir);
  if (root === null) return { error: `No AI-DLC project found at or above ${startDir}.` };
  if (!folderExists(sessionsRoot)) return { error: `No Kiro data found: ${sessionsRoot} does not exist.` };
  const space = readActiveSpace(root);
  const { intent, file } = readActiveIntent(root, space);
  if (intent === '') return { error: `No active AI-DLC intent found at ${file}.` };
  const audit = readAudit(root, space, intent);
  if (audit.files.length === 0) return { error: `No audit file found in ${audit.dir}.` };
  const sessions = findSessions(sessionsRoot, root);
  if (sessions.length === 0) return { error: `No Kiro sessions found for ${root} in ${sessionsRoot}.` };
  const records = readCreditRecords(sessions);
  const windows = parseStageWindows(audit.text, now);
  return {
    intent,
    sessionCount: sessions.length,
    recordCount: records.length,
    totals: attribute(windows, records),
  };
}

function reportText(run) {
  return (
    `Intent: ${run.intent}   Sessions: ${run.sessionCount}   Credit records: ${run.recordCount}\n` +
    formatReport(run.totals)
  );
}

/**
 * Report action: one combined table (intent, stage, credits) for all intents of the active space,
 * or only the named ones. Writes nothing. A warning for an intent left out (no audit file) goes to
 * stderr, so the table on stdout stays clean.
 * @param {{startDir:string, sessionsRoot:string, intents?:string[], now?:number}} opts
 * @returns {{stdout:string, stderr:string, exitCode:number}}
 */
export function runReport({ startDir, sessionsRoot, intents = [] }) {
  const root = findProjectRoot(startDir);
  if (root === null) return fail(`No AI-DLC project found at or above ${startDir}.`);
  if (!folderExists(sessionsRoot)) return fail(`No Kiro data found: ${sessionsRoot} does not exist.`);
  const space = readActiveSpace(root);
  const existing = listIntents(root, space);
  if (existing.length === 0) return fail(`No AI-DLC intents found in ${intentsDir(root, space)}.`);
  const unknown = intents.filter((n) => !existing.includes(n));
  if (unknown.length > 0) {
    return fail(`Unknown intent: ${unknown.join(', ')}. Intents that exist: ${existing.join(', ')}.`);
  }
  const selected = intents.length === 0 ? existing : existing.filter((n) => intents.includes(n));
  const { audits, missing } = readIntentAudits(root, space, selected);
  if (audits.length === 0) {
    return fail(`No audit file found for any intent in ${intentsDir(root, space)}.`);
  }
  const sessions = findSessions(sessionsRoot, root);
  if (sessions.length === 0) return fail(`No Kiro sessions found for ${root} in ${sessionsRoot}.`);
  const records = readCreditRecords(sessions);
  const totals = attributeIntents(audits, records);
  const warnings = missing.map((n) => `Warning: intent ${n} has no audit file and is left out.`).join('\n');
  return {
    stdout:
      `Intents: ${audits.length}   Sessions: ${sessions.length}   Credit records: ${records.length}\n` +
      formatIntentsReport(totals),
    stderr: warnings,
    exitCode: 0,
  };
}


function osUserName() {
  try {
    return userInfo().username;
  } catch {
    return '';
  }
}

/**
 * Export action: the report, plus one file (JSON or CSV by its ending) with the run's figures.
 * @param {{startDir:string, sessionsRoot:string, file:string, person?:string, force?:boolean,
 *          now?:number, toolVersion:string, defaultPerson?:string}} opts
 *   `person` undefined means the computer's user name (or `defaultPerson`, for tests).
 * @returns {{stdout:string, stderr:string, exitCode:number}}
 */
export function runExport({
  startDir,
  sessionsRoot,
  file,
  person,
  force = false,
  now = Date.now(),
  toolVersion,
  defaultPerson,
}) {
  const run = collectRun({ startDir, sessionsRoot, now });
  if ('error' in run) return fail(run.error);
  const lower = String(file).toLowerCase();
  const format = lower.endsWith('.json') ? 'json' : lower.endsWith('.csv') ? 'csv' : null;
  if (format === null) return fail('Export file must end in .json or .csv.');
  const name = (person === undefined ? (defaultPerson ?? osUserName()) : person).trim();
  if (name === '') return fail('Person name is empty.');
  const target = resolve(startDir, file);
  if (existsSync(target) && !force) return fail(`${file} exists; use --force to replace it.`);
  const exp = buildExport({
    toolVersion,
    person: name,
    intent: run.intent,
    exportedAt: new Date(now).toISOString(),
    totals: run.totals,
  });
  try {
    writeFileSync(target, serializeExport(exp, format), { flag: force ? 'w' : 'wx' });
  } catch (err) {
    if (err && err.code === 'EEXIST') return fail(`${file} exists; use --force to replace it.`);
    return fail(`Cannot write ${file}: ${err && err.message ? err.message : err}`);
  }
  return { stdout: `${reportText(run)}\n\nExport written to ${file}`, stderr: '', exitCode: 0 };
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Combine action: read export files and print one section per intent. Writes nothing.
 * Exit code 2 when any file was skipped; 1 when no file is named.
 * @param {{startDir:string, files:string[]}} opts
 * @returns {{stdout:string, stderr:string, exitCode:number}}
 */
export function runCombine({ startDir, files }) {
  if (!files || files.length === 0) return fail('No export files given.');
  const skipped = [];
  const usable = [];
  const seen = new Set();
  for (const file of files) {
    const abs = resolve(startDir, file);
    if (seen.has(abs)) continue;
    seen.add(abs);
    let text;
    try {
      text = readFileSync(abs, 'utf8');
    } catch {
      skipped.push({ file, reason: 'the file cannot be read' });
      continue;
    }
    const r = parseExport(text);
    if (r.reason) skipped.push({ file, reason: r.reason });
    else usable.push({ file, exp: r.export });
  }
  const warnings = skipped.map((s) => `Warning: ${s.file} skipped: ${s.reason}.`).join('\n');
  const exitCode = skipped.length > 0 ? 2 : 0;
  if (usable.length === 0) return { stdout: '', stderr: warnings, exitCode: 2 };

  // Newest export per (person, intent); a tie goes to the file path that sorts last (BR4.1).
  const best = new Map();
  const ignored = [];
  for (const u of usable) {
    const key = JSON.stringify([u.exp.person, u.exp.intent]);
    const cur = best.get(key);
    if (!cur) {
      best.set(key, u);
      continue;
    }
    const a = Date.parse(u.exp.exported_at);
    const b = Date.parse(cur.exp.exported_at);
    const newWins = a > b || (a === b && byText(u.file, cur.file) > 0);
    const [winner, loser] = newWins ? [u, cur] : [cur, u];
    best.set(key, winner);
    ignored.push({ file: loser.file, lostTo: winner.file });
  }
  // A file ignored by one that was itself ignored later points at the final winner.
  const finalFile = (f) => {
    let cur = f;
    for (const i of ignored) if (i.file === cur) cur = i.lostTo;
    return cur;
  };

  const byIntent = new Map();
  for (const u of best.values()) {
    if (!byIntent.has(u.exp.intent)) byIntent.set(u.exp.intent, []);
    byIntent.get(u.exp.intent).push(u.exp);
  }
  const sections = [];
  for (const intent of [...byIntent.keys()].sort(byText)) {
    const exps = byIntent.get(intent).sort((x, y) => byText(x.person, y.person));
    const people = exps.map((e) => e.person);
    const order = [];
    for (const e of exps) for (const s of e.stages) if (!order.includes(s.stage)) order.push(s.stage);
    order.push(OUTSIDE);
    const credits = (e, stage) =>
      stage === OUTSIDE ? e.outside : (e.stages.find((s) => s.stage === stage)?.credits ?? 0);
    const rows = [];
    for (const stage of order) for (const e of exps) rows.push([stage, e.person, credits(e, stage)]);
    let teamTotal = 0;
    for (const e of exps) teamTotal += e.stages.reduce((a, s) => a + s.credits, 0) + e.outside;
    const w1 = Math.max('stage'.length, ...rows.map((r) => r[0].length));
    const w2 = Math.max('person'.length, ...people.map((p) => p.length));
    const line = (a, b, c) => `${a.padEnd(w1)}  ${b.padEnd(w2)}  ${c.padStart(10)}`;
    const out = [
      `Intent: ${intent}`,
      line('stage', 'person', 'credits'),
      line('-'.repeat(w1), '-'.repeat(w2), '-'.repeat(10)),
      ...rows.map((r) => line(r[0], r[1], r[2].toFixed(3))),
      line('-'.repeat(w1), '-'.repeat(w2), '-'.repeat(10)),
      line('TEAM TOTAL', '', teamTotal.toFixed(3)),
    ];
    sections.push(out.join('\n'));
  }
  const parts = [sections.join('\n\n')];
  if (ignored.length > 0) {
    parts.push(
      ['Ignored (a newer export exists for the same person and intent):']
        .concat(ignored.map((i) => `  ${i.file} (newer: ${finalFile(i.lostTo)})`))
        .join('\n'),
    );
  }
  return { stdout: parts.join('\n\n'), stderr: warnings, exitCode };
}
