import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStageWindows,
  parseCreditRecords,
  attribute,
  formatReport,
  selectSessions,
} from '../src/lib.mjs';

const audit = [
  '**Timestamp**: 2026-01-01T10:00:00Z\n**Event**: STAGE_STARTED\n**Stage**: alpha\n',
  '**Timestamp**: 2026-01-01T10:10:00Z\n**Event**: STAGE_COMPLETED\n**Stage**: alpha\n',
  '**Timestamp**: 2026-01-01T10:20:00Z\n**Event**: STAGE_STARTED\n**Stage**: beta\n',
].join('\n---\n');

const NOW = Date.parse('2026-01-01T11:00:00Z');
const rec = (ts, usage, unit = 'credit') =>
  JSON.stringify({
    timestamp: ts,
    payload: { type: 'usage_summary', promptTurnSummaries: [{ unit, usage }] },
  });
const jsonl = [
  rec('2026-01-01T10:05:00.000Z', 1.5),
  rec('2026-01-01T10:15:00.000Z', 0.25), // between stages
  rec('2026-01-01T10:30:00.000Z', 2),
  JSON.stringify({ timestamp: '2026-01-01T10:06:00Z', payload: { type: 'other' } }),
  'not json usage_summary',
].join('\n');

test('FR1: credits are reported per stage', () => {
  const t = attribute(parseStageWindows(audit, NOW), parseCreditRecords(jsonl));
  assert.deepEqual(
    t.stages.map((s) => [s.stage, s.credits]),
    [['alpha', 1.5], ['beta', 2]],
  );
});

test('FR1.1: credit records are read from usage_summary lines', () => {
  const r = parseCreditRecords(jsonl);
  assert.equal(r.length, 3);
  assert.equal(r[0].credits, 1.5);
  assert.equal(r[0].timestamp, Date.parse('2026-01-01T10:05:00.000Z'));
  const multi = rec('2026-01-01T10:00:00Z', 1) + '\n' + rec('2026-01-01T10:00:01Z', 9, 'other');
  assert.equal(parseCreditRecords(multi)[0].credits, 1);
  assert.equal(parseCreditRecords(multi)[1].credits, 0);
});

test('FR1.2: credits go to the stage running at that time; re-entry is its own window; gaps are outside', () => {
  const re = audit + '\n---\n**Timestamp**: 2026-01-01T10:40:00Z\n**Event**: STAGE_STARTED\n**Stage**: alpha\n';
  const w = parseStageWindows(re, Date.parse('2026-01-01T12:00:00Z'));
  assert.equal(w.filter((x) => x.stage === 'alpha').length, 2);
  assert.equal(w.find((x) => x.stage === 'beta').end, Date.parse('2026-01-01T12:00:00Z'));
  const t = attribute(parseStageWindows(audit, NOW), parseCreditRecords(jsonl));
  assert.equal(t.outside, 0.25);
});

test('FR2: report is a table with stage, 3-decimal credits, outside and total lines', () => {
  const text = formatReport(attribute(parseStageWindows(audit, NOW), parseCreditRecords(jsonl)));
  assert.match(text, /^stage\s+credits/);
  assert.match(text, /alpha\s+1\.500/);
  assert.match(text, /outside a stage\s+0\.250/);
  assert.match(text, /TOTAL\s+3\.750/);
});

test('FR3: only sessions for this project are used', () => {
  const sessions = [
    { id: 'a', workspacePaths: ['/work/mine'] },
    { id: 'b', workspacePaths: ['/work/other'] },
    { id: 'c', workspacePaths: ['/work/mine/'] },
    { id: 'd' },
  ];
  assert.deepEqual(selectSessions(sessions, '/work/mine').map((s) => s.id), ['a', 'c']);
});

test('NFR1: total equals the sum of the records read, nothing lost or invented', () => {
  const records = parseCreditRecords(jsonl);
  const sum = records.reduce((a, r) => a + r.credits, 0);
  const t = attribute(parseStageWindows(audit, NOW), records);
  const parts = t.stages.reduce((a, s) => a + s.credits, 0) + t.outside;
  assert.equal(t.total, sum);
  assert.ok(Math.abs(parts - sum) < 1e-9);
});
