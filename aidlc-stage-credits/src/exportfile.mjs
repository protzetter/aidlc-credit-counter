// Export file: build, write (JSON or CSV), read back and check. Pure text in, text out; no file access.
import { OUTSIDE } from './lib.mjs';

/** The export format version this tool writes and reads. */
export const FORMAT_VERSION = 1;

/** CSV header row (BR3.5). */
export const CSV_COLUMNS = [
  'format_version',
  'tool_version',
  'person',
  'intent',
  'exported_at',
  'kind',
  'stage',
  'credits',
];

/**
 * Build an export from a run report. Only the allowed fields are kept; credits stay at full precision.
 * @param {{toolVersion:string, person:string, intent:string, exportedAt:string,
 *          totals:{stages:{stage:string,credits:number}[], outside:number}}} input
 * @returns {{format_version:number,tool_version:string,person:string,intent:string,exported_at:string,
 *            stages:{stage:string,credits:number}[],outside:number}}
 */
export function buildExport({ toolVersion, person, intent, exportedAt, totals }) {
  return {
    format_version: FORMAT_VERSION,
    tool_version: toolVersion,
    person,
    intent,
    exported_at: exportedAt,
    stages: totals.stages.map((s) => ({ stage: s.stage, credits: s.credits })),
    outside: totals.outside,
  };
}

/** JSON text of an export (credits at full precision). */
export function toJson(exp) {
  return JSON.stringify(exp, null, 2) + '\n';
}

/** Wrap a CSV field in double quotes when it holds a comma, a double quote or a line break. */
export function csvField(value) {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV text of an export: one row per stage (kind "stage") and a last row with kind "outside". */
export function toCsv(exp) {
  const head = [exp.format_version, exp.tool_version, exp.person, exp.intent, exp.exported_at];
  const row = (kind, stage, credits) => [...head, kind, stage, credits].map(csvField).join(',');
  const lines = [CSV_COLUMNS.join(',')];
  for (const s of exp.stages) lines.push(row('stage', s.stage, s.credits));
  lines.push(row('outside', '', exp.outside));
  return lines.join('\n') + '\n';
}

/** Text of an export in the given format ('json' or 'csv'). */
export function serializeExport(exp, format) {
  return format === 'csv' ? toCsv(exp) : toJson(exp);
}

/**
 * Split CSV text into rows of fields (RFC 4180 style: quoted fields may hold commas,
 * doubled quotes and line breaks). Returns null when a quote is left open.
 * @returns {string[][]|null}
 */
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += c;
      }
      i++;
      continue;
    }
    if (c === '"' && field === '') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
    i++;
  }
  if (inQuotes) return null;
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const NUMBER_TEXT = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** Turn parsed CSV rows into an export object, or return {reason}. */
function csvToExport(rows) {
  if (rows.length === 0) return { reason: 'the file is empty' };
  if (rows[0].join(',') !== CSV_COLUMNS.join(',')) return { reason: 'the CSV header row is not the expected one' };
  const body = rows.slice(1).filter((r) => !(r.length === 1 && r[0] === ''));
  if (body.length === 0) return { reason: 'there is no stage row' };
  let meta = null;
  const stages = [];
  let outside;
  for (const r of body) {
    if (r.length !== CSV_COLUMNS.length) return { reason: 'a CSV row does not have 8 columns' };
    const [fv, tv, person, intent, at, kind, stage, credits] = r;
    const m = [fv, tv, person, intent, at].join('\u0000');
    if (meta === null) meta = { text: m, fv, tv, person, intent, at };
    else if (meta.text !== m) return { reason: 'the rows disagree on version, person, intent or time' };
    if (!NUMBER_TEXT.test(credits.trim())) return { reason: `credits "${credits}" is not a number` };
    const value = Number(credits);
    if (kind === 'stage') stages.push({ stage, credits: value });
    else if (kind === 'outside') {
      if (outside !== undefined) return { reason: 'there is more than one outside row' };
      outside = value;
    } else return { reason: `unknown row kind "${kind}"` };
  }
  if (!/^\d+$/.test(meta.fv.trim())) return { reason: 'format_version is not a whole number' };
  return {
    value: {
      format_version: Number(meta.fv),
      tool_version: meta.tv,
      person: meta.person,
      intent: meta.intent,
      exported_at: meta.at,
      stages,
      outside,
    },
  };
}

const isNumber = (n) => typeof n === 'number' && Number.isFinite(n);

/**
 * Check every ExportFile constraint (BR4.2). Returns the reason it is unusable, or null.
 * @param {any} e
 */
export function exportProblem(e) {
  if (e === null || typeof e !== 'object' || Array.isArray(e)) return 'it is not an export object';
  for (const k of ['format_version', 'tool_version', 'person', 'intent', 'exported_at', 'stages', 'outside']) {
    if (e[k] === undefined || e[k] === null) return `required field "${k}" is missing`;
  }
  if (!Number.isInteger(e.format_version) || e.format_version < 1) return 'format_version is not a whole number';
  if (e.format_version > FORMAT_VERSION) {
    return `format_version ${e.format_version} is newer than this tool reads (${FORMAT_VERSION})`;
  }
  if (typeof e.tool_version !== 'string') return 'tool_version is not text';
  if (typeof e.exported_at !== 'string' || Number.isNaN(Date.parse(e.exported_at))) {
    return 'exported_at is not a valid time';
  }
  if (typeof e.person !== 'string' || e.person.trim() === '') return 'person is empty';
  if (typeof e.intent !== 'string' || e.intent.trim() === '') return 'intent is empty';
  if (!Array.isArray(e.stages)) return 'stages is not a list';
  if (e.stages.length === 0) return 'there is no stage row';
  const seen = new Set();
  for (const s of e.stages) {
    if (s === null || typeof s !== 'object' || typeof s.stage !== 'string' || s.stage === '') {
      return 'a stage has no name';
    }
    if (s.stage === OUTSIDE) return `a stage is named like the outside row ("${OUTSIDE}")`;
    if (seen.has(s.stage)) return `stage "${s.stage}" appears twice`;
    seen.add(s.stage);
    if (!isNumber(s.credits)) return `credits of stage "${s.stage}" is not a number`;
    if (s.credits < 0) return `credits of stage "${s.stage}" is negative`;
  }
  if (!isNumber(e.outside)) return 'outside credits is not a number';
  if (e.outside < 0) return 'outside credits is negative';
  return null;
}

/**
 * Read export text (JSON, or CSV when it does not start with "{") and check it.
 * The person is trimmed. Only the allowed fields are kept.
 * @returns {{export:object}|{reason:string}}
 */
export function parseExport(text) {
  const body = String(text).replace(/^\uFEFF/, '');
  if (body.trim() === '') return { reason: 'the file is empty' };
  let obj;
  if (body.trimStart().startsWith('{')) {
    try {
      obj = JSON.parse(body);
    } catch {
      return { reason: 'it is not valid JSON' };
    }
  } else {
    const rows = parseCsvRows(body);
    if (rows === null) return { reason: 'it is not valid CSV (a quote is left open)' };
    const r = csvToExport(rows);
    if (r.reason) return { reason: r.reason };
    obj = r.value;
  }
  const problem = exportProblem(obj);
  if (problem) return { reason: problem };
  return {
    export: {
      format_version: obj.format_version,
      tool_version: obj.tool_version,
      person: obj.person.trim(),
      intent: obj.intent,
      exported_at: obj.exported_at,
      stages: obj.stages.map((s) => ({ stage: s.stage, credits: s.credits })),
      outside: obj.outside,
    },
  };
}
