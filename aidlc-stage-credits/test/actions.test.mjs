import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReport, runExport, runCombine } from '../src/actions.mjs';
import { parseExport } from '../src/exportfile.mjs';

const NOW = Date.parse('2026-01-01T11:00:00Z');
const AUDIT = [
  '**Timestamp**: 2026-01-01T10:00:00Z\n**Event**: STAGE_STARTED\n**Stage**: alpha\n',
  '**Timestamp**: 2026-01-01T10:10:00Z\n**Event**: STAGE_COMPLETED\n**Stage**: alpha\n',
  '**Timestamp**: 2026-01-01T10:20:00Z\n**Event**: STAGE_STARTED\n**Stage**: beta\n',
].join('\n---\n');
const usage = (ts, credits) =>
  JSON.stringify({
    timestamp: ts,
    payload: { type: 'usage_summary', promptTurnSummaries: [{ unit: 'credit', usage: credits }] },
  });

function put(file, text) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
}

/** A fake project and a fake Kiro sessions folder; `parts` leaves out what a test wants missing. */
function fixture(parts = {}) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'asc-actions-')));
  const root = join(base, 'project');
  const sessionsRoot = join(base, 'kiro-sessions');
  mkdirSync(join(root, 'aidlc'), { recursive: true });
  if (!parts.noIntent) put(join(root, 'aidlc', 'spaces', 'default', 'intents', 'active-intent'), 'i-1\n');
  if (!parts.noAudit) put(join(root, 'aidlc', 'spaces', 'default', 'intents', 'i-1', 'audit', 'a.md'), AUDIT);
  else mkdirSync(join(root, 'aidlc', 'spaces', 'default', 'intents', 'i-1', 'audit'), { recursive: true });
  if (!parts.noSessionsRoot) {
    mkdirSync(sessionsRoot, { recursive: true });
    if (!parts.noSession) {
      const s = join(sessionsRoot, 'ws', 's1');
      put(join(s, 'session.json'), JSON.stringify({ workspacePaths: [root] }));
      put(
        join(s, 'messages.jsonl'),
        [
          usage('2026-01-01T10:05:00.000Z', 1.5),
          usage('2026-01-01T10:15:00.000Z', 0.25),
          usage('2026-01-01T10:30:00.000Z', 2),
        ].join('\n'),
      );
    }
  }
  return { base, root, sessionsRoot, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

function snapshot(dir) {
  const out = {};
  for (const rel of readdirSync(dir, { recursive: true })) {
    const p = join(dir, rel);
    if (statSync(p).isFile()) out[rel.split('\\').join('/')] = readFileSync(p, 'utf8');
  }
  return out;
}

test('FR1: report prints one combined table for all intents and exits 0', () => {
  const f = fixture();
  try {
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot });
    assert.equal(r.exitCode, 0);
    assert.equal(r.stderr, '');
    assert.match(r.stdout, /^Intents: 1 {3}Sessions: 1 {3}Credit records: 3\n/);
    assert.match(r.stdout, /i-1\s+alpha\s+1\.500/);
    // beta is still open: with no `now`, it ends at the audit's last time, so its record is outside.
    assert.match(r.stdout, /i-1\s+beta\s+0\.000/);
    assert.match(r.stdout, /outside any stage\s+2\.250/);
    assert.match(r.stdout, /TOTAL\s+3\.750/);
  } finally {
    f.cleanup();
  }
});

/** Adds a second intent with its own audit and records on top of the fixture. */
function addSecondIntent(f, { withAudit = true } = {}) {
  const dir = join(f.root, 'aidlc', 'spaces', 'default', 'intents', 'i-2');
  mkdirSync(dir, { recursive: true });
  if (withAudit) {
    put(
      join(dir, 'audit', 'a.md'),
      [
        '**Timestamp**: 2026-01-01T10:25:00Z\n**Event**: STAGE_STARTED\n**Stage**: gamma\n',
        '**Timestamp**: 2026-01-01T10:40:00Z\n**Event**: STAGE_COMPLETED\n**Stage**: gamma\n',
      ].join('\n---\n'),
    );
  }
}

test('FR1/FR2: all intents by default; --intent narrows; the intents option is repeatable', () => {
  const f = fixture();
  try {
    addSecondIntent(f);
    const all = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot });
    assert.match(all.stdout, /^Intents: 2 /);
    assert.match(all.stdout, /i-1\s+alpha\s+1\.500/);
    assert.match(all.stdout, /i-2\s+gamma\s+2\.000/);
    assert.match(all.stdout, /outside any stage\s+0\.250/);
    assert.match(all.stdout, /TOTAL\s+3\.750/);

    const one = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, intents: ['i-2'] });
    assert.match(one.stdout, /^Intents: 1 /);
    assert.doesNotMatch(one.stdout, /i-1/);
    assert.match(one.stdout, /i-2\s+gamma\s+2\.000/);

    const both = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, intents: ['i-2', 'i-1'] });
    assert.match(both.stdout, /^Intents: 2 /);
    // the listed order of the intents, not the order of the options
    assert.ok(both.stdout.indexOf('i-1') < both.stdout.indexOf('i-2'));
  } finally {
    f.cleanup();
  }
});

test('FR1.2: an unknown intent stops with its name and the intents that exist, exit 1', () => {
  const f = fixture();
  try {
    addSecondIntent(f);
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, intents: ['nope'] });
    assert.equal(r.exitCode, 1);
    assert.equal(r.stdout, '');
    assert.equal(r.stderr, 'Unknown intent: nope. Intents that exist: i-1, i-2.');
  } finally {
    f.cleanup();
  }
});

test('FR1.3: an intent with no audit file is left out with one warning; exit stays 0', () => {
  const f = fixture();
  try {
    addSecondIntent(f, { withAudit: false });
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot });
    assert.equal(r.exitCode, 0);
    assert.equal(r.stderr, 'Warning: intent i-2 has no audit file and is left out.');
    assert.match(r.stdout, /^Intents: 1 /);
    assert.doesNotMatch(r.stdout, /i-2/);
  } finally {
    f.cleanup();
  }
});

test('FR1: no intent at all stops with a message and exit 1', () => {
  const f = fixture({ noAudit: true });
  try {
    rmSync(join(f.root, 'aidlc', 'spaces'), { recursive: true, force: true });
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot });
    assert.equal(r.exitCode, 1);
    assert.match(r.stderr, /^No AI-DLC intents found in /);
  } finally {
    f.cleanup();
  }
});

test('FR6.2/BR2.1: no sessions folder stops with message and exit 1', () => {
  const f = fixture({ noSessionsRoot: true });
  try {
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 1);
    assert.equal(r.stderr, `No Kiro data found: ${f.sessionsRoot} does not exist.`);
  } finally {
    f.cleanup();
  }
});

test('FR1: report needs no active intent', () => {
  const f = fixture({ noIntent: true });
  try {
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /TOTAL\s+3\.750/);
    // export still needs it
    const e = runExport({ startDir: f.root, sessionsRoot: f.sessionsRoot, file: 'o.json', person: 'a', now: NOW, toolVersion: '1' });
    assert.equal(e.exitCode, 1);
    assert.match(e.stderr, /^No active AI-DLC intent found at /);
  } finally {
    f.cleanup();
  }
});

test('FR6.2/BR2.1: no audit file for any intent stops with message and exit 1', () => {
  const f = fixture({ noAudit: true });
  try {
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 1);
    assert.equal(
      r.stderr,
      `No audit file found for any intent in ${join(f.root, 'aidlc', 'spaces', 'default', 'intents')}.`,
    );
  } finally {
    f.cleanup();
  }
});


test('FR6.2/BR2.1: no session for the project stops with message and exit 1', () => {
  const f = fixture({ noSession: true });
  try {
    const r = runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 1);
    assert.equal(r.stderr, `No Kiro sessions found for ${f.root} in ${f.sessionsRoot}.`);
  } finally {
    f.cleanup();
  }
});

test('FR6.2/BR1.3: no AI-DLC project above the folder stops with message and exit 1', () => {
  const f = fixture();
  try {
    const empty = join(f.base, 'plain');
    mkdirSync(empty);
    const r = runReport({ startDir: empty, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 1);
    assert.equal(r.stderr, `No AI-DLC project found at or above ${empty}.`);
  } finally {
    f.cleanup();
  }
});

test('FR2.2: report works from a subfolder of the project', () => {
  const f = fixture();
  try {
    const sub = join(f.root, 'src', 'deep');
    mkdirSync(sub, { recursive: true });
    const r = runReport({ startDir: sub, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /TOTAL\s+3\.750/);
  } finally {
    f.cleanup();
  }
});

test('FR3.1/BR3.1/BR8.1: export writes only the named file; report and combine write nothing', () => {
  const f = fixture();
  try {
    const before = snapshot(f.base);
    runReport({ startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW });
    assert.deepEqual(snapshot(f.base), before, 'report changed files');

    const r = runExport({
      startDir: f.root,
      sessionsRoot: f.sessionsRoot,
      file: 'out.json',
      person: ' ana ',
      now: NOW,
      toolVersion: '1.0.0',
    });
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /TOTAL\s+3\.750/);
    const after = snapshot(f.base);
    const added = Object.keys(after).filter((k) => !(k in before));
    assert.deepEqual(added, ['project/out.json']);
    for (const k of Object.keys(before)) assert.equal(after[k], before[k], `${k} changed`);
    const exp = parseExport(after['project/out.json']).export;
    assert.equal(exp.person, 'ana');
    assert.equal(exp.intent, 'i-1');
    assert.equal(exp.exported_at, '2026-01-01T11:00:00.000Z');
    assert.deepEqual(exp.stages, [
      { stage: 'alpha', credits: 1.5 },
      { stage: 'beta', credits: 2 },
    ]);
    assert.equal(exp.outside, 0.25);

    const snap2 = snapshot(f.base);
    const c = runCombine({ startDir: f.root, files: ['out.json'] });
    assert.equal(c.exitCode, 0);
    assert.deepEqual(snapshot(f.base), snap2, 'combine changed files');
  } finally {
    f.cleanup();
  }
});

test('FR3.1: the export format follows the file ending (.csv)', () => {
  const f = fixture();
  try {
    const r = runExport({
      startDir: f.root,
      sessionsRoot: f.sessionsRoot,
      file: 'out.csv',
      person: 'ana',
      now: NOW,
      toolVersion: '1.0.0',
    });
    assert.equal(r.exitCode, 0);
    const text = readFileSync(join(f.root, 'out.csv'), 'utf8');
    assert.match(text, /^format_version,tool_version,person,intent,exported_at,kind,stage,credits\n/);
    assert.match(text, /,outside,,0\.25\n$/);
  } finally {
    f.cleanup();
  }
});

test('BR3.1: export refuses an existing file without --force and replaces it with --force', () => {
  const f = fixture();
  try {
    put(join(f.root, 'out.json'), 'OLD');
    const args = { startDir: f.root, sessionsRoot: f.sessionsRoot, file: 'out.json', person: 'ana', now: NOW, toolVersion: '1.0.0' };
    const r = runExport(args);
    assert.equal(r.exitCode, 1);
    assert.equal(r.stderr, 'out.json exists; use --force to replace it.');
    assert.equal(readFileSync(join(f.root, 'out.json'), 'utf8'), 'OLD');
    const r2 = runExport({ ...args, force: true });
    assert.equal(r2.exitCode, 0);
    assert.ok(parseExport(readFileSync(join(f.root, 'out.json'), 'utf8')).export);
  } finally {
    f.cleanup();
  }
});

test('BR3.2/BR3.3: export refuses a wrong file ending and an empty person, and writes nothing', () => {
  const f = fixture();
  try {
    const before = snapshot(f.base);
    const base = { startDir: f.root, sessionsRoot: f.sessionsRoot, now: NOW, toolVersion: '1.0.0' };
    const a = runExport({ ...base, file: 'out.txt', person: 'ana' });
    assert.equal(a.exitCode, 1);
    assert.equal(a.stderr, 'Export file must end in .json or .csv.');
    const b = runExport({ ...base, file: 'out.json', person: '   ' });
    assert.equal(b.exitCode, 1);
    assert.equal(b.stderr, 'Person name is empty.');
    const c = runExport({ ...base, file: 'out.json', defaultPerson: 'whoami' });
    assert.equal(c.exitCode, 0);
    assert.equal(parseExport(readFileSync(join(f.root, 'out.json'), 'utf8')).export.person, 'whoami');
    rmSync(join(f.root, 'out.json'));
    assert.deepEqual(snapshot(f.base), before);
  } finally {
    f.cleanup();
  }
});

// ---- combine ----
function exportJson(person, intent, at, stages, outside = 0) {
  return JSON.stringify({
    format_version: 1,
    tool_version: '1.0.0',
    person,
    intent,
    exported_at: at,
    stages: Object.entries(stages).map(([stage, credits]) => ({ stage, credits })),
    outside,
  });
}

test('FR4/BR4.1: combine keeps the newest export per person and intent and lists the ignored', () => {
  const f = fixture();
  try {
    put(join(f.base, 'old.json'), exportJson('ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 100 }));
    put(join(f.base, 'new.json'), exportJson('ana', 'i-1', '2026-01-02T09:00:00Z', { alpha: 1 }));
    const r = runCombine({ startDir: f.base, files: ['old.json', 'new.json'] });
    assert.equal(r.exitCode, 0);
    assert.match(r.stdout, /alpha\s+ana\s+1\.000/);
    assert.doesNotMatch(r.stdout, /100\.000/);
    assert.match(r.stdout, /TEAM TOTAL\s+1\.000/);
    assert.match(r.stdout, /Ignored[^\n]*\n\s+old\.json \(newer: new\.json\)/);
  } finally {
    f.cleanup();
  }
});

test('BR4.1: on equal time the file path that sorts last counts', () => {
  const f = fixture();
  try {
    put(join(f.base, 'a.json'), exportJson('ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 1 }));
    put(join(f.base, 'b.json'), exportJson('ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 2 }));
    const r = runCombine({ startDir: f.base, files: ['b.json', 'a.json'] });
    assert.match(r.stdout, /alpha\s+ana\s+2\.000/);
    assert.match(r.stdout, /a\.json \(newer: b\.json\)/);
  } finally {
    f.cleanup();
  }
});

test('BR4.2/BR4.3: bad files are skipped with a warning and exit 2; all bad prints no report; none given is exit 1', () => {
  const f = fixture();
  try {
    put(join(f.base, 'good.json'), exportJson('ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 1 }));
    put(join(f.base, 'bad.json'), '{oops');
    put(join(f.base, 'empty.json'), '');
    const r = runCombine({ startDir: f.base, files: ['good.json', 'bad.json', 'empty.json', 'missing.json'] });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /alpha\s+ana\s+1\.000/);
    assert.match(r.stderr, /Warning: bad\.json skipped: it is not valid JSON/);
    assert.match(r.stderr, /Warning: empty\.json skipped: the file is empty/);
    assert.match(r.stderr, /Warning: missing\.json skipped: the file cannot be read/);

    const all = runCombine({ startDir: f.base, files: ['bad.json'] });
    assert.equal(all.exitCode, 2);
    assert.equal(all.stdout, '');
    assert.match(all.stderr, /bad\.json skipped/);

    const none = runCombine({ startDir: f.base, files: [] });
    assert.equal(none.exitCode, 1);
    assert.equal(none.stderr, 'No export files given.');
  } finally {
    f.cleanup();
  }
});

test('BR4.4/BR4.5/BR4.6: intents stay apart, names are exact, rows are ordered and filled with 0.000', () => {
  const f = fixture();
  try {
    put(join(f.base, 'bob.json'), exportJson('bob', 'i-1', '2026-01-01T09:00:00Z', { beta: 2, alpha: 1 }, 0.5));
    put(join(f.base, 'ana-lower.json'), exportJson('ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 3, gamma: 4 }, 0.25));
    put(join(f.base, 'ana-upper.json'), exportJson('Ana', 'i-1', '2026-01-01T09:00:00Z', { alpha: 10 }));
    put(join(f.base, 'other.json'), exportJson('ana', 'i-2', '2026-01-01T09:00:00Z', { zeta: 7 }));
    const r = runCombine({ startDir: f.base, files: ['bob.json', 'ana-lower.json', 'ana-upper.json', 'other.json'] });
    assert.equal(r.exitCode, 0);
    const [first, second] = r.stdout.split('\n\n');
    assert.match(first, /^Intent: i-1/);
    assert.match(second, /^Intent: i-2/);
    assert.doesNotMatch(second, /alpha/);
    const rows = first
      .split('\n')
      .map((l) => l.trim().split(/\s{2,}/))
      .filter((c) => c.length === 3 && /^\d+\.\d{3}$/.test(c[2]));
    assert.deepEqual(rows.map((c) => c.join('|')), [
      'alpha|Ana|10.000',
      'alpha|ana|3.000',
      'alpha|bob|1.000',
      'gamma|Ana|0.000',
      'gamma|ana|4.000',
      'gamma|bob|0.000',
      'beta|Ana|0.000',
      'beta|ana|0.000',
      'beta|bob|2.000',
      'outside a stage|Ana|0.000',
      'outside a stage|ana|0.250',
      'outside a stage|bob|0.500',
    ]);
    assert.match(first, /TEAM TOTAL\s+20\.750/);
    assert.match(second, /TEAM TOTAL\s+7\.000/);
  } finally {
    f.cleanup();
  }
});
