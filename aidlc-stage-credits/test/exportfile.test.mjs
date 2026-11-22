import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExport,
  serializeExport,
  parseExport,
  csvField,
  CSV_COLUMNS,
} from '../src/exportfile.mjs';

const totals = {
  stages: [
    { stage: 'intent-capture', credits: 15.674123456789 },
    { stage: 'plan, "quoted"\nstage', credits: 0.1 },
  ],
  outside: 1.3780000000001,
  total: 0,
};
const make = () =>
  buildExport({
    toolVersion: '1.0.0',
    person: 'ana, the "first"',
    intent: '261122-example',
    exportedAt: '2026-11-22T10:00:00.000Z',
    totals,
  });

const good = () => ({
  format_version: 1,
  tool_version: '1.0.0',
  person: 'ana',
  intent: 'i1',
  exported_at: '2026-11-22T10:00:00Z',
  stages: [{ stage: 'a', credits: 1 }],
  outside: 0,
});
const bad = (patch) => JSON.stringify({ ...good(), ...patch });

test('FR3.2/BR3.5: JSON and CSV round trip give the same data at full precision', () => {
  const exp = make();
  assert.deepEqual(parseExport(serializeExport(exp, 'json')).export, exp);
  assert.deepEqual(parseExport(serializeExport(exp, 'csv')).export, exp);
});

test('BR3.4: an export holds only the allowed fields', () => {
  const exp = buildExport({
    toolVersion: '1.0.0',
    person: 'ana',
    intent: 'i',
    exportedAt: '2026-01-01T00:00:00Z',
    totals: { stages: [{ stage: 's', credits: 1, secret: 'x' }], outside: 0, total: 1, path: '/home/x' },
  });
  assert.deepEqual(Object.keys(exp), [
    'format_version',
    'tool_version',
    'person',
    'intent',
    'exported_at',
    'stages',
    'outside',
  ]);
  assert.deepEqual(Object.keys(exp.stages[0]), ['stage', 'credits']);
  const csv = serializeExport(exp, 'csv').split('\n');
  assert.equal(csv[0], CSV_COLUMNS.join(','));
  assert.equal(csv[1], '1,1.0.0,ana,i,2026-01-01T00:00:00Z,stage,s,1');
  assert.equal(csv[2], '1,1.0.0,ana,i,2026-01-01T00:00:00Z,outside,,0');
});

test('BR3.5: CSV quotes commas, quotes and line breaks', () => {
  assert.equal(csvField('plain'), 'plain');
  assert.equal(csvField('a,b'), '"a,b"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
  assert.equal(csvField('two\nlines'), '"two\nlines"');
});

test('BR4.2: each unusable-file reason is rejected', () => {
  const cases = [
    ['empty file', '', /empty/],
    ['bad JSON', '{"format_version":', /not valid JSON/],
    ['missing field', JSON.stringify({ ...good(), person: undefined }), /"person" is missing/],
    ['newer format_version', bad({ format_version: 2 }), /newer than this tool/],
    ['bad exported_at', bad({ exported_at: 'yesterday' }), /exported_at/],
    ['empty person', bad({ person: '   ' }), /person is empty/],
    ['empty intent', bad({ intent: '' }), /intent is empty/],
    ['negative credits', bad({ stages: [{ stage: 'a', credits: -1 }] }), /negative/],
    ['credits not a number', bad({ stages: [{ stage: 'a', credits: '3' }] }), /not a number/],
    ['outside not a number', bad({ outside: 'x' }), /outside credits is not a number/],
    ['negative outside', bad({ outside: -0.5 }), /outside credits is negative/],
    [
      'duplicate stage',
      bad({ stages: [{ stage: 'a', credits: 1 }, { stage: 'a', credits: 2 }] }),
      /appears twice/,
    ],
    ['reserved stage name', bad({ stages: [{ stage: 'outside a stage', credits: 1 }] }), /named like the outside row/],
    ['no stage row', bad({ stages: [] }), /no stage row/],
    ['CSV with an open quote', 'format_version\n"abc', /CSV/],
    ['CSV with the wrong header', 'a,b,c\n1,2,3', /header/],
  ];
  for (const [name, text, reason] of cases) {
    const r = parseExport(text);
    assert.ok(r.reason, `${name} should be rejected`);
    assert.match(r.reason, reason, name);
  }
});

test('BR4.2: a usable export is accepted and the person is trimmed', () => {
  const r = parseExport(bad({ person: '  ana  ' }));
  assert.equal(r.export.person, 'ana');
});

test('BR4.2: a CSV with a bad credit figure or no outside row is rejected', () => {
  const head = CSV_COLUMNS.join(',');
  const base = '1,1.0.0,ana,i,2026-01-01T00:00:00Z';
  assert.match(parseExport(`${head}\n${base},stage,a,abc\n${base},outside,,0\n`).reason, /not a number/);
  assert.match(parseExport(`${head}\n${base},outside,,0\n`).reason, /no stage row/);
  assert.match(parseExport(`${head}\n${base},stage,a,1\n`).reason, /"outside" is missing/);
});
