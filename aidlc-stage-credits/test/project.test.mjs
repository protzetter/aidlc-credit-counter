import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findProjectRoot,
  readActiveSpace,
  readActiveIntent,
  readAudit,
  findSessions,
  readCreditRecords,
} from '../src/project.mjs';

function scratch() {
  return realpathSync(mkdtempSync(join(tmpdir(), 'asc-project-')));
}
function put(file, text) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
}
const usage = (ts, credits) =>
  JSON.stringify({
    timestamp: ts,
    payload: { type: 'usage_summary', promptTurnSummaries: [{ unit: 'credit', usage: credits }] },
  });

test('BR1.3/FR2.2: the project root is found from a subfolder; none gives null', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'aidlc'));
    mkdirSync(join(root, 'a', 'b'), { recursive: true });
    assert.equal(findProjectRoot(join(root, 'a', 'b')), root);
    assert.equal(findProjectRoot(root), root);
    const none = scratch();
    try {
      assert.equal(findProjectRoot(none), null);
    } finally {
      rmSync(none, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('BR1.1/FR2.1: the space comes from aidlc/active-space and defaults to "default"', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'aidlc'));
    assert.equal(readActiveSpace(root), 'default');
    put(join(root, 'aidlc', 'active-space'), '  \n');
    assert.equal(readActiveSpace(root), 'default');
    put(join(root, 'aidlc', 'active-space'), 'team-a\n');
    assert.equal(readActiveSpace(root), 'team-a');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('BR1.2: the active intent is read from the space; missing or blank gives an empty intent', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'aidlc'));
    assert.equal(readActiveIntent(root, 'default').intent, '');
    put(join(root, 'aidlc', 'spaces', 'default', 'intents', 'active-intent'), '\n  \n');
    assert.equal(readActiveIntent(root, 'default').intent, '');
    put(join(root, 'aidlc', 'spaces', 'team-a', 'intents', 'active-intent'), 'i-1\n');
    const r = readActiveIntent(root, 'team-a');
    assert.equal(r.intent, 'i-1');
    assert.equal(r.file, join(root, 'aidlc', 'spaces', 'team-a', 'intents', 'active-intent'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('FR2.1: the audit text joins the .md files of the intent', () => {
  const root = scratch();
  try {
    const dir = join(root, 'aidlc', 'spaces', 'default', 'intents', 'i-1', 'audit');
    put(join(dir, 'b.md'), 'BBB');
    put(join(dir, 'a.md'), 'AAA');
    put(join(dir, 'ignore.txt'), 'ZZZ');
    const r = readAudit(root, 'default', 'i-1');
    assert.deepEqual(r.files, ['a.md', 'b.md']);
    assert.match(r.text, /^AAA[\s\S]*BBB$/);
    assert.equal(readAudit(root, 'default', 'missing').files.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('BR1.4: sessions are matched by the project root; unreadable session and bad line are skipped', () => {
  const root = scratch();
  const sessions = scratch();
  try {
    const mine = join(sessions, 'ws1', 's-mine');
    put(join(mine, 'session.json'), JSON.stringify({ workspacePaths: [root + '/'] }));
    put(join(mine, 'messages.jsonl'), [usage('2026-01-01T10:00:00Z', 1.5), 'garbage usage_summary'].join('\n'));
    const other = join(sessions, 'ws1', 's-other');
    put(join(other, 'session.json'), JSON.stringify({ workspacePaths: ['/somewhere/else'] }));
    put(join(other, 'messages.jsonl'), usage('2026-01-01T10:00:00Z', 99));
    const broken = join(sessions, 'ws2', 's-broken');
    put(join(broken, 'session.json'), '{not json');
    const noMessages = join(sessions, 'ws2', 's-nomsg');
    put(join(noMessages, 'session.json'), JSON.stringify({ workspacePaths: [root] }));

    const found = findSessions(sessions, root);
    assert.equal(found.length, 2);
    assert.ok(found.every((s) => s.dir !== other && s.dir !== broken));
    const records = readCreditRecords(found);
    assert.equal(records.length, 1);
    assert.equal(records[0].credits, 1.5);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(sessions, { recursive: true, force: true });
  }
});

test('BR1.4: a chat started before the project folder was renamed is matched by its rootPaths', () => {
  const root = scratch();
  const sessions = scratch();
  try {
    const renamed = join(sessions, 'ws1', 's-renamed');
    put(
      join(renamed, 'session.json'),
      JSON.stringify({ workspacePaths: ['/old/name/of/project'], rootPaths: ['/old/name/of/project', root] }),
    );
    put(join(renamed, 'messages.jsonl'), usage('2026-01-01T10:00:00Z', 2.25));
    const other = join(sessions, 'ws1', 's-other');
    put(join(other, 'session.json'), JSON.stringify({ workspacePaths: ['/x'], rootPaths: ['/y'] }));
    put(join(other, 'messages.jsonl'), usage('2026-01-01T10:00:00Z', 99));

    const found = findSessions(sessions, root);
    assert.deepEqual(found.map((s) => s.dir), [renamed]);
    const records = readCreditRecords(found);
    assert.equal(records.length, 1);
    assert.equal(records[0].credits, 2.25);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(sessions, { recursive: true, force: true });
  }
});
