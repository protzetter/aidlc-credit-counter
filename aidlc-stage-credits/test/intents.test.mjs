import test from 'node:test';
import assert from 'node:assert/strict';
import { attributeIntents, formatIntentsReport } from '../src/intents.mjs';

const ev = (ts, event, stage) => `**Timestamp**: ${ts}\n**Event**: ${event}\n**Stage**: ${stage}\n`;
const T = (s) => Date.parse(`2026-01-01T${s}Z`);
const rec = (s, credits) => ({ timestamp: T(s), credits });

const A = {
  intent: 'i-a',
  text: [ev('2026-01-01T10:00:00Z', 'STAGE_STARTED', 'alpha'), ev('2026-01-01T10:10:00Z', 'STAGE_COMPLETED', 'alpha')].join('\n---\n'),
};
const B = {
  intent: 'i-b',
  text: [ev('2026-01-01T10:30:00Z', 'STAGE_STARTED', 'beta'), ev('2026-01-01T10:40:00Z', 'STAGE_COMPLETED', 'beta')].join('\n---\n'),
};

test('FR2.1: a record between two intents is counted once, on "outside any stage"', () => {
  const t = attributeIntents([A, B], [rec('10:05:00', 1), rec('10:20:00', 0.5), rec('10:35:00', 2)]);
  assert.deepEqual(t.rows, [
    { intent: 'i-a', stage: 'alpha', credits: 1 },
    { intent: 'i-b', stage: 'beta', credits: 2 },
  ]);
  assert.equal(t.outside, 0.5);
  assert.equal(t.total, 3.5);
});

test('FR2.2: overlapping windows of two intents give the record to the latest-starting one', () => {
  const C = {
    intent: 'i-c',
    text: [ev('2026-01-01T10:05:00Z', 'STAGE_STARTED', 'gamma'), ev('2026-01-01T10:15:00Z', 'STAGE_COMPLETED', 'gamma')].join('\n---\n'),
  };
  const t = attributeIntents([A, C], [rec('10:07:00', 4), rec('10:02:00', 1)]);
  assert.equal(t.rows.find((r) => r.stage === 'gamma').credits, 4);
  assert.equal(t.rows.find((r) => r.stage === 'alpha').credits, 1);
  assert.equal(t.outside, 0);
});

test('FR2.3: a window still open ends at that audit last time; the end itself is excluded', () => {
  const open = { intent: 'i-o', text: [ev('2026-01-01T10:00:00Z', 'STAGE_STARTED', 'alpha'), ev('2026-01-01T10:30:00Z', 'STAGE_STARTED', 'beta')].join('\n---\n') };
  const t = attributeIntents([open], [rec('10:10:00', 1), rec('10:30:00', 2), rec('11:00:00', 8)]);
  assert.equal(t.rows.find((r) => r.stage === 'alpha').credits, 1);
  assert.equal(t.rows.find((r) => r.stage === 'beta').credits, 0);
  assert.equal(t.outside, 10);
});

test('NFR1: the total equals the sum of all rows plus outside; rows print at 3 decimals', () => {
  const records = [rec('10:01:00', 0.1), rec('10:02:00', 0.2), rec('10:31:00', 1.23456), rec('12:00:00', 0.0004)];
  const t = attributeIntents([A, B], records);
  const sum = t.rows.reduce((a, r) => a + r.credits, 0) + t.outside;
  assert.ok(Math.abs(sum - t.total) < 1e-9);
  const text = formatIntentsReport(t);
  assert.match(text, /i-a\s+alpha\s+0\.300/);
  assert.match(text, /i-b\s+beta\s+1\.235/);
  assert.match(text, /outside any stage\s+0\.000/);
  assert.match(text, /TOTAL\s+1\.535/);
  assert.equal(text.split('\n').filter((l) => l.includes('outside any stage')).length, 1);
});
