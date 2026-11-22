import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main, toolVersion, USAGE } from '../src/cli.mjs';

const BIN = fileURLToPath(new URL('../bin/aidlc-stage-credits.mjs', import.meta.url));
const NOW = Date.parse('2026-01-01T11:00:00Z');

function put(file, text) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
}
function project() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'asc-cli-')));
  const root = join(base, 'project');
  const sessionsRoot = join(base, 'sessions');
  put(join(root, 'aidlc', 'spaces', 'default', 'intents', 'active-intent'), 'i-1');
  put(
    join(root, 'aidlc', 'spaces', 'default', 'intents', 'i-1', 'audit', 'a.md'),
    '**Timestamp**: 2026-01-01T10:00:00Z\n**Event**: STAGE_STARTED\n**Stage**: alpha\n',
  );
  put(join(sessionsRoot, 'ws', 's1', 'session.json'), JSON.stringify({ workspacePaths: [root] }));
  put(
    join(sessionsRoot, 'ws', 's1', 'messages.jsonl'),
    JSON.stringify({
      timestamp: '2026-01-01T10:05:00Z',
      payload: { type: 'usage_summary', promptTurnSummaries: [{ unit: 'credit', usage: 2 }] },
    }),
  );
  return { base, root, sessionsRoot, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

test('BR6.1: no action means report, and its exit code is passed through', () => {
  const p = project();
  try {
    const env = { cwd: p.root, sessionsRoot: p.sessionsRoot, now: NOW };
    const ok = main([], env);
    assert.equal(ok.exitCode, 0);
    assert.match(ok.stdout, /alpha\s+2\.000/);
    const missing = main(['report'], { ...env, sessionsRoot: join(p.base, 'nope') });
    assert.equal(missing.exitCode, 1);
    assert.match(missing.stderr, /^No Kiro data found/);
  } finally {
    p.cleanup();
  }
});

test('BR6.1: an unknown action prints the usage and exits 1', () => {
  const r = main(['frobnicate'], { cwd: '/', sessionsRoot: '/nope' });
  assert.equal(r.exitCode, 1);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /^Unknown action: frobnicate\n/);
  assert.ok(r.stderr.includes(USAGE));
});

test('BR6.1: export reads --person and --force; combine passes its files and exit code 2', () => {
  const p = project();
  try {
    const env = { cwd: p.root, sessionsRoot: p.sessionsRoot, now: NOW, toolVersion: '9.9.9' };
    assert.equal(main(['export', 'x.json', '--person', 'ana'], env).exitCode, 0);
    const exp = JSON.parse(readFileSync(join(p.root, 'x.json'), 'utf8'));
    assert.equal(exp.person, 'ana');
    assert.equal(exp.tool_version, '9.9.9');
    assert.equal(main(['export', 'x.json', '--person', 'ana'], env).exitCode, 1);
    assert.equal(main(['export', 'x.json', '--person=bo', '--force'], env).exitCode, 0);
    assert.equal(JSON.parse(readFileSync(join(p.root, 'x.json'), 'utf8')).person, 'bo');
    assert.equal(main(['export'], env).exitCode, 1);
    assert.equal(main(['export', 'y.json', '--person'], env).exitCode, 1);
    assert.equal(main(['export', 'y.json', '--wat'], env).exitCode, 1);

    put(join(p.root, 'bad.json'), 'nope');
    const c = main(['combine', 'x.json', 'bad.json'], env);
    assert.equal(c.exitCode, 2);
    assert.match(c.stdout, /alpha\s+bo\s+2\.000/);
    assert.equal(main(['combine'], env).exitCode, 1);
  } finally {
    p.cleanup();
  }
});

test('FR1.2: the tool version comes from package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(toolVersion(), pkg.version);
  assert.equal(pkg.version, '1.0.0');
  assert.equal(pkg.engines.node, '>=22');
  assert.equal(pkg.bin['aidlc-stage-credits'], 'bin/aidlc-stage-credits.mjs');
  assert.ok(pkg.files.includes('SKILL.md') && pkg.files.includes('README.md'));
});

test('BR6.1: the command file runs, prints the usage for an unknown action and exits 1', () => {
  const home = realpathSync(mkdtempSync(join(tmpdir(), 'asc-home-')));
  try {
    const r = spawnSync(process.execPath, [BIN, 'frobnicate'], {
      cwd: home,
      env: { ...process.env, HOME: home, USERPROFILE: home },
      encoding: 'utf8',
    });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Unknown action: frobnicate/);
    assert.match(r.stderr, /aidlc-stage-credits combine/);
    assert.equal(readFileSync(BIN, 'utf8').split('\n')[0], '#!/usr/bin/env node');
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
