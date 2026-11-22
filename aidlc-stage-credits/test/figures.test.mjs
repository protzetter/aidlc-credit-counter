import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { attribute } from '../src/lib.mjs';

// Figure check (FR5, NFR1): anonymized real records and stage windows against the expected figures.
const load = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/real-sample/${name}.json`, import.meta.url), 'utf8'));
const records = load('records');
const windows = load('windows');
const expected = load('expected');

const RECORD_FIELDS = ['credits', 'timestamp'];
const WINDOW_FIELDS = ['end', 'stage', 'start'];
const EXPECTED_FIELDS = ['confirmed_by_hand', 'outside', 'stages', 'total'];
const EXPECTED_STAGE_FIELDS = ['credits', 'stage'];

const keys = (o) => Object.keys(o).sort();
const fixed = (n) => Number(n).toFixed(3);

/** Every field found in the three data files that is not allowed (BR5.1). */
function unexpectedFields({ records, windows, expected }) {
  const bad = [];
  const check = (where, obj, allowed) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) bad.push(`${where}.${k}`);
  };
  records.forEach((r, i) => check(`records[${i}]`, r, RECORD_FIELDS));
  windows.forEach((w, i) => check(`windows[${i}]`, w, WINDOW_FIELDS));
  check('expected', expected, EXPECTED_FIELDS);
  (expected.stages || []).forEach((s, i) => check(`expected.stages[${i}]`, s, EXPECTED_STAGE_FIELDS));
  return bad;
}

test('FR5.2/NFR1/BR5.2: per-stage and total figures match the expected ones at 3 decimals', () => {
  const t = attribute(
    windows.map((w) => ({ stage: w.stage, start: Date.parse(w.start), end: Date.parse(w.end) })),
    records.map((r) => ({ timestamp: Date.parse(r.timestamp), credits: r.credits })),
  );
  assert.deepEqual(
    t.stages.map((s) => [s.stage, fixed(s.credits)]),
    expected.stages.map((s) => [s.stage, fixed(s.credits)]),
  );
  assert.equal(fixed(t.outside), fixed(expected.outside));
  assert.equal(fixed(t.total), fixed(expected.total));
  // Nothing lost or invented (BR2.2): the parts add up to the total.
  const parts = t.stages.reduce((a, s) => a + s.credits, 0) + t.outside;
  assert.ok(Math.abs(parts - t.total) < 1e-9);
  assert.equal(typeof expected.confirmed_by_hand, 'boolean');
});

test('FR5.1/BR5.1: the test data holds no field beyond those allowed and no path-like text', () => {
  assert.deepEqual(unexpectedFields({ records, windows, expected }), []);
  for (const r of records) {
    assert.equal(typeof r.credits, 'number');
    assert.ok(!Number.isNaN(Date.parse(r.timestamp)));
  }
  assert.ok(records.length > 0 && windows.length > 0);
  for (const name of ['records', 'windows', 'expected']) {
    const text = readFileSync(new URL(`./fixtures/real-sample/${name}.json`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /[\\/@~]|sess_|\.kiro|\.md/, `${name}.json holds path-like text`);
  }
});

test('BR5.1: the field scan fails on an extra field (the check is not vacuous)', () => {
  const dirty = {
    records: [{ ...records[0], sessionId: 'x' }],
    windows: [{ ...windows[0], path: 'x' }],
    expected: { ...expected, user: 'x', stages: [{ ...expected.stages[0], note: 'x' }] },
  };
  assert.deepEqual(unexpectedFields(dirty), [
    'records[0].sessionId',
    'windows[0].path',
    'expected.user',
    'expected.stages[0].note',
  ]);
  assert.deepEqual(keys(records[0]), RECORD_FIELDS);
});
