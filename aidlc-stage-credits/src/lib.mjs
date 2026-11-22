// Pure logic for per-stage Kiro credit reporting. No file or network access.

export const OUTSIDE = 'outside a stage';

/**
 * Read STAGE_STARTED / STAGE_COMPLETED blocks from AI-DLC audit markdown.
 * Each start-to-next-completion of a stage is its own window. A restart of an
 * open stage closes the earlier window at the restart time. A window still open
 * at the end runs to `now` (default: last timestamp seen).
 * @returns {{stage:string,start:number,end:number}[]} times in epoch ms
 */
export function parseStageWindows(auditText, now) {
  const re =
    /\*\*Timestamp\*\*:\s*(\S+)\s*\n\*\*Event\*\*:\s*(STAGE_STARTED|STAGE_COMPLETED)\s*\n\*\*Stage\*\*:\s*(\S+)/g;
  const windows = [];
  const open = new Map();
  let last = 0;
  let m;
  while ((m = re.exec(auditText)) !== null) {
    const t = Date.parse(m[1]);
    if (Number.isNaN(t)) continue;
    const stage = m[3];
    if (t > last) last = t;
    if (m[2] === 'STAGE_STARTED') {
      if (open.has(stage)) windows.push({ stage, start: open.get(stage), end: t });
      open.set(stage, t);
    } else if (open.has(stage)) {
      windows.push({ stage, start: open.get(stage), end: t });
      open.delete(stage);
    }
  }
  const endOfOpen = now !== undefined ? now : last;
  for (const [stage, start] of open) windows.push({ stage, start, end: Math.max(endOfOpen, start) });
  return windows.sort((a, b) => a.start - b.start);
}

/**
 * Read usage_summary records from a messages.jsonl text.
 * credits = sum of promptTurnSummaries[].usage where unit is "credit".
 * @returns {{timestamp:number,credits:number}[]}
 */
export function parseCreditRecords(jsonlText) {
  const out = [];
  for (const line of jsonlText.split('\n')) {
    if (!line.includes('usage_summary')) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const p = obj && obj.payload;
    if (!p || p.type !== 'usage_summary' || !Array.isArray(p.promptTurnSummaries)) continue;
    const t = Date.parse(obj.timestamp);
    if (Number.isNaN(t)) continue;
    let credits = 0;
    for (const s of p.promptTurnSummaries) {
      if (s && s.unit === 'credit' && typeof s.usage === 'number') credits += s.usage;
    }
    out.push({ timestamp: t, credits });
  }
  return out;
}

/**
 * Keep only sessions whose workspacePaths include the project path.
 * @param {{workspacePaths?:string[]}[]} sessions
 */
export function selectSessions(sessions, projectPath) {
  const norm = (p) => String(p).replace(/\/+$/, '');
  const target = norm(projectPath);
  return sessions.filter(
    (s) => Array.isArray(s.workspacePaths) && s.workspacePaths.some((p) => norm(p) === target),
  );
}

/**
 * Add credits per stage; a record goes to the window with start <= t < end
 * (the latest-starting one if several match), otherwise to "outside".
 * @returns {{stages:{stage:string,credits:number}[],outside:number,total:number}}
 */
export function attribute(windows, records) {
  const byStage = new Map();
  for (const w of windows) if (!byStage.has(w.stage)) byStage.set(w.stage, 0);
  let outside = 0;
  let total = 0;
  for (const r of records) {
    total += r.credits;
    let hit = null;
    for (const w of windows) {
      if (r.timestamp >= w.start && r.timestamp < w.end && (!hit || w.start >= hit.start)) hit = w;
    }
    if (hit) byStage.set(hit.stage, byStage.get(hit.stage) + r.credits);
    else outside += r.credits;
  }
  const stages = [...byStage].map(([stage, credits]) => ({ stage, credits }));
  return { stages, outside, total };
}

/** Plain text table: stage, credits (3 decimals), then outside and total lines. */
export function formatReport(totals) {
  const rows = [...totals.stages.map((s) => [s.stage, s.credits]), [OUTSIDE, totals.outside]];
  const width = Math.max(5, ...rows.map((r) => r[0].length), 'TOTAL'.length);
  const line = (a, b) => `${a.padEnd(width)}  ${b.padStart(10)}`;
  const out = [line('stage', 'credits'), line('-'.repeat(width), '-'.repeat(10))];
  for (const [name, c] of rows) out.push(line(name, c.toFixed(3)));
  out.push(line('-'.repeat(width), '-'.repeat(10)));
  out.push(line('TOTAL', totals.total.toFixed(3)));
  return out.join('\n');
}
