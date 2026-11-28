// Pure logic for the all-intents report. No file access: the audit texts and the credit records come in.
import { parseStageWindows } from './lib.mjs';

export const OUTSIDE_ANY = 'outside any stage';

/**
 * Add credits per intent and stage across all the given intents.
 * Each intent's windows come from `parseStageWindows(text)` with no `now`, so a window still open
 * ends at that audit's last time. A record goes to the window with start <= t < end across ALL
 * intents (the latest-starting one when several match, the later intent when starts are equal),
 * otherwise to "outside any stage" once for the whole project.
 * @param {{intent:string,text:string}[]} audits intents in the order to show
 * @param {{timestamp:number,credits:number}[]} records
 * @returns {{rows:{intent:string,stage:string,credits:number}[],outside:number,total:number}}
 */
export function attributeIntents(audits, records) {
  const rows = [];
  const rowOf = new Map();
  const windows = [];
  for (const a of audits) {
    for (const w of parseStageWindows(a.text)) {
      const key = JSON.stringify([a.intent, w.stage]);
      if (!rowOf.has(key)) {
        const row = { intent: a.intent, stage: w.stage, credits: 0 };
        rowOf.set(key, row);
        rows.push(row);
      }
      windows.push({ ...w, row: rowOf.get(key) });
    }
  }
  let outside = 0;
  let total = 0;
  for (const r of records) {
    total += r.credits;
    let hit = null;
    for (const w of windows) {
      if (r.timestamp >= w.start && r.timestamp < w.end && (!hit || w.start >= hit.start)) hit = w;
    }
    if (hit) hit.row.credits += r.credits;
    else outside += r.credits;
  }
  return { rows, outside, total };
}

/** Plain text table: intent, stage, credits (3 decimals), then the outside line and the total. */
export function formatIntentsReport(totals) {
  const w1 = Math.max('intent'.length, ...totals.rows.map((r) => r.intent.length));
  const w2 = Math.max('stage'.length, OUTSIDE_ANY.length, ...totals.rows.map((r) => r.stage.length));
  const line = (a, b, c) => `${a.padEnd(w1)}  ${b.padEnd(w2)}  ${c.padStart(10)}`;
  const rule = line('-'.repeat(w1), '-'.repeat(w2), '-'.repeat(10));
  return [
    line('intent', 'stage', 'credits'),
    rule,
    ...totals.rows.map((r) => line(r.intent, r.stage, r.credits.toFixed(3))),
    line('', OUTSIDE_ANY, totals.outside.toFixed(3)),
    rule,
    line('', 'TOTAL', totals.total.toFixed(3)),
  ].join('\n');
}
