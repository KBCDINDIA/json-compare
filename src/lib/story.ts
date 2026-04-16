import type { DiffEntry, DiffResult, TimelinePair, TimelineResult } from './types';
import { humanizeKey, formatValue, friendlyTypeName } from './humanize';

// ── Category detection ──────────────────────────────────────────────

type Category =
  | 'financial'
  | 'status'
  | 'date'
  | 'contact'
  | 'identity'
  | 'measurement'
  | 'config'
  | 'other';

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  financial: [
    'amount', 'amt', 'price', 'cost', 'total', 'subtotal', 'tax', 'gst',
    'discount', 'disc', 'fee', 'charge', 'payment', 'pymt', 'invoice', 'inv',
    'credit', 'debit', 'balance', 'bal', 'bill', 'rate', 'value', 'val',
    'currency', 'rupee', 'dollar', 'fare', 'rent', 'salary', 'wage',
  ],
  status: [
    'status', 'state', 'flag', 'active', 'enabled', 'disabled', 'pending',
    'approved', 'rejected', 'completed', 'cancelled', 'published', 'draft',
    'locked', 'verified', 'confirmed',
  ],
  date: [
    'date', 'time', 'timestamp', 'created', 'updated', 'modified', 'deleted',
    'expires', 'expiry', 'deadline', 'schedule', 'start', 'end', 'dob', 'doj',
  ],
  contact: [
    'email', 'phone', 'mobile', 'address', 'addr', 'city', 'state', 'zip',
    'pin', 'country', 'fax', 'tel', 'url', 'website',
  ],
  identity: [
    'name', 'first', 'last', 'title', 'user', 'customer', 'cust', 'merchant',
    'org', 'company', 'department', 'emp', 'id', 'uid', 'ref', 'code',
  ],
  measurement: [
    'km', 'miles', 'hrs', 'hours', 'minutes', 'weight', 'height', 'length',
    'width', 'size', 'count', 'qty', 'quantity', 'running', 'distance',
    'duration', 'speed', 'volume', 'area',
  ],
  config: [
    'config', 'setting', 'option', 'preference', 'theme', 'mode', 'type',
    'format', 'template', 'layout', 'version', 'prefix', 'suffix', 'pattern',
  ],
  other: [],
};

function categorize(entry: DiffEntry): Category {
  const text = entry.path.map((p) => String(p).toLowerCase()).join(' ');
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'other') continue;
    for (const kw of keywords) {
      if (text.includes(kw)) return cat as Category;
    }
  }
  return 'other';
}

// ── Helpers ──────────────────────────────────────────────────────────

function pct(oldVal: number, newVal: number): string {
  if (oldVal === 0) return '';
  const delta = ((newVal - oldVal) / Math.abs(oldVal)) * 100;
  const dir = delta > 0 ? 'increase' : 'decrease';
  return ` (a ${Math.abs(Math.round(delta))}% ${dir})`;
}

function numDelta(e: DiffEntry): string {
  if (typeof e.oldValue === 'number' && typeof e.newValue === 'number') {
    const ov = e.oldValue;
    const nv = e.newValue;
    const dir = nv > ov ? 'increased' : 'decreased';
    return `${humanizeKey(String(e.path[e.path.length - 1]))} ${dir} from ${formatValue(ov)} to ${formatValue(nv)}${pct(ov, nv)}`;
  }
  return `${humanizeKey(String(e.path[e.path.length - 1]))} changed from ${formatValue(e.oldValue)} to ${formatValue(e.newValue)}`;
}

function fieldLabel(e: DiffEntry): string {
  return humanizeKey(String(e.path[e.path.length - 1]));
}

// ── Category paragraph builders ─────────────────────────────────────

const CATEGORY_LABELS: Record<Category, string> = {
  financial: 'Financial Changes',
  status: 'Status & State Updates',
  date: 'Date & Time Changes',
  contact: 'Contact Information',
  identity: 'Identity & Reference Changes',
  measurement: 'Measurements & Quantities',
  config: 'Configuration & Settings',
  other: 'Other Changes',
};

const CATEGORY_INTROS: Record<Category, string[]> = {
  financial: [
    'On the financial side,',
    'Looking at the monetary aspects,',
    'In terms of financial data,',
    'Regarding the financial figures,',
  ],
  status: [
    'Several status updates were observed.',
    'The following status changes took place.',
    'On the status front,',
  ],
  date: [
    'Some date and time fields were updated.',
    'Timeline-related changes include:',
    'The following date changes were noted.',
  ],
  contact: [
    'Contact information saw some changes.',
    'Updates to contact details include:',
    'On the contact information side,',
  ],
  identity: [
    'Identity and reference fields were modified.',
    'Key identifiers changed as follows.',
    'Some reference data was updated.',
  ],
  measurement: [
    'Measurement and quantity values shifted.',
    'Looking at the measured values,',
    'Quantities and measurements were adjusted.',
  ],
  config: [
    'Configuration settings were adjusted.',
    'Some system settings changed.',
    'On the configuration side,',
  ],
  other: [
    'Additionally,',
    'Other notable changes include:',
    'A few more changes were observed.',
  ],
};

function pickIntro(cat: Category, seed: number): string {
  const pool = CATEGORY_INTROS[cat];
  return pool[seed % pool.length];
}

function buildCategoryParagraph(cat: Category, entries: DiffEntry[], seed: number): string {
  if (entries.length === 0) return '';

  const lines: string[] = [];
  lines.push(pickIntro(cat, seed));

  const added = entries.filter((e) => e.severity === 'added');
  const removed = entries.filter((e) => e.severity === 'removed');
  const changed = entries.filter((e) => e.severity === 'changed');
  const typed = entries.filter((e) => e.severity === 'typeChanged');

  if (changed.length > 0) {
    if (cat === 'financial') {
      for (const e of changed) {
        lines.push(numDelta(e) + '.');
      }
    } else {
      for (const e of changed) {
        lines.push(`The ${fieldLabel(e)} was updated from ${formatValue(e.oldValue)} to ${formatValue(e.newValue)}.`);
      }
    }
  }

  if (added.length > 0) {
    if (added.length === 1) {
      const e = added[0];
      lines.push(`A new field "${fieldLabel(e)}" was introduced with the value ${formatValue(e.newValue)}.`);
    } else {
      const names = added.map((e) => fieldLabel(e));
      lines.push(`${added.length} new fields were added: ${names.join(', ')}.`);
    }
  }

  if (removed.length > 0) {
    if (removed.length === 1) {
      const e = removed[0];
      lines.push(`The field "${fieldLabel(e)}" was removed (previously ${formatValue(e.oldValue)}).`);
    } else {
      const names = removed.map((e) => fieldLabel(e));
      lines.push(`${removed.length} fields were removed: ${names.join(', ')}. This may indicate a data cleanup or schema change.`);
    }
  }

  if (typed.length > 0) {
    for (const e of typed) {
      lines.push(`⚠️ "${fieldLabel(e)}" underwent a structural change — it was previously ${friendlyTypeName(e.oldValue)} but is now ${friendlyTypeName(e.newValue)}. This is a significant change that may affect how the data is used.`);
    }
  }

  return lines.join(' ');
}

// ── Opening summary ─────────────────────────────────────────────────

function openingSummary(diff: DiffResult, fromLabel: string, toLabel: string): string {
  const { counts } = diff;
  if (counts.total === 0) {
    return `No differences were found between "${fromLabel}" and "${toLabel}". The data is identical.`;
  }

  const parts: string[] = [];
  parts.push(`Between "${fromLabel}" and "${toLabel}", a total of ${counts.total} change${counts.total === 1 ? ' was' : 's were'} detected.`);

  const breakdown: string[] = [];
  if (counts.changed > 0) breakdown.push(`${counts.changed} value${counts.changed === 1 ? ' was' : 's were'} modified`);
  if (counts.added > 0) breakdown.push(`${counts.added} new field${counts.added === 1 ? ' was' : 's were'} added`);
  if (counts.removed > 0) breakdown.push(`${counts.removed} field${counts.removed === 1 ? ' was' : 's were'} removed`);
  if (counts.typeChanged > 0) breakdown.push(`${counts.typeChanged} field${counts.typeChanged === 1 ? '' : 's'} had ${counts.typeChanged === 1 ? 'its' : 'their'} data type changed`);

  if (breakdown.length > 0) {
    parts.push('Specifically, ' + breakdown.join(', ') + '.');
  }

  // Overall sentiment
  if (counts.removed > counts.added && counts.removed > counts.changed) {
    parts.push('The dominant pattern here is data removal — this could indicate a cleanup, archival, or simplification of the record.');
  } else if (counts.added > counts.changed && counts.added > counts.removed) {
    parts.push('The data appears to be growing with new fields being introduced — this suggests new features or additional information being captured.');
  } else if (counts.changed > 0 && counts.added === 0 && counts.removed === 0) {
    parts.push('All changes were value updates with no structural additions or removals — this looks like a routine data refresh or correction.');
  } else if (counts.typeChanged > 0) {
    parts.push('The presence of type changes is noteworthy — it suggests a structural or schema-level modification, not just a data update.');
  }

  return parts.join(' ');
}

// ── Highlights paragraph ────────────────────────────────────────────

function highlightsParagraph(diff: DiffResult): string {
  if (diff.topFindings.length === 0) return '';

  const lines: string[] = [];
  lines.push('Here are the most noteworthy changes:');

  for (const e of diff.topFindings) {
    switch (e.severity) {
      case 'typeChanged':
        lines.push(`• The "${fieldLabel(e)}" field changed its entire structure from ${friendlyTypeName(e.oldValue)} to ${friendlyTypeName(e.newValue)} — this is the most impactful type of change as it can affect downstream systems.`);
        break;
      case 'removed':
        lines.push(`• The "${fieldLabel(e)}" was completely removed from the data.`);
        break;
      case 'added':
        lines.push(`• A new field "${fieldLabel(e)}" appeared with value ${formatValue(e.newValue)}.`);
        break;
      case 'changed':
        if (typeof e.oldValue === 'number' && typeof e.newValue === 'number') {
          lines.push(`• ${numDelta(e)}.`);
        } else {
          lines.push(`• The "${fieldLabel(e)}" changed from ${formatValue(e.oldValue)} to ${formatValue(e.newValue)}.`);
        }
        break;
      default:
        lines.push(`• ${e.sentence}`);
    }
  }

  return lines.join('\n');
}

// ── Closing / insight ───────────────────────────────────────────────

function closingInsight(diff: DiffResult, fromLabel: string, toLabel: string): string {
  const { counts } = diff;
  if (counts.total === 0) return '';

  const lines: string[] = [];

  if (counts.total <= 3) {
    lines.push(`In summary, the changes between "${fromLabel}" and "${toLabel}" are minimal — only ${counts.total} modification${counts.total === 1 ? '' : 's'}. This suggests a minor update or correction rather than a significant revision.`);
  } else if (counts.total <= 10) {
    lines.push(`Overall, ${counts.total} changes were made between "${fromLabel}" and "${toLabel}", representing a moderate level of modification. This is consistent with a targeted update or adjustment.`);
  } else {
    lines.push(`With ${counts.total} changes detected, the transition from "${fromLabel}" to "${toLabel}" represents a substantial update. It would be worth reviewing these changes carefully to ensure nothing was unintentionally modified.`);
  }

  if (counts.typeChanged > 0) {
    lines.push(`Special attention should be paid to the ${counts.typeChanged} type change${counts.typeChanged === 1 ? '' : 's'}, as these can break integrations or processing logic that expects a specific data format.`);
  }

  return lines.join(' ');
}

// ── Public: build story for one pair ────────────────────────────────

export function buildPairStory(pair: TimelinePair): string {
  const { from, to, diff } = pair;
  const fromLabel = from.title || 'Previous version';
  const toLabel = to.title || 'Updated version';

  if (diff.entries.length === 0) {
    return `No differences were found between "${fromLabel}" and "${toLabel}". The data is identical across both versions.`;
  }

  const paragraphs: string[] = [];

  // 1. Opening
  paragraphs.push(openingSummary(diff, fromLabel, toLabel));

  // 2. Highlights
  const hl = highlightsParagraph(diff);
  if (hl) paragraphs.push(hl);

  // 3. Category breakdowns
  const catMap = new Map<Category, DiffEntry[]>();
  for (const e of diff.entries) {
    const cat = categorize(e);
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(e);
  }

  const catOrder: Category[] = ['financial', 'status', 'measurement', 'identity', 'contact', 'date', 'config', 'other'];
  let seed = 0;
  for (const cat of catOrder) {
    const entries = catMap.get(cat);
    if (!entries || entries.length === 0) continue;
    const para = buildCategoryParagraph(cat, entries, seed++);
    if (para) paragraphs.push(para);
  }

  // 4. Closing
  paragraphs.push(closingInsight(diff, fromLabel, toLabel));

  return paragraphs.join('\n\n');
}

// ── Public: build full timeline story ───────────────────────────────

export function buildTimelineStory(result: TimelineResult): string {
  const { sorted, pairs, totalCounts } = result;

  if (pairs.length === 0) return 'No comparisons were made.';

  const sections: string[] = [];

  // Timeline intro
  if (pairs.length === 1) {
    sections.push(`This report compares two JSON data snapshots to identify what changed between them.`);
  } else {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const dateRange =
      first.date && last.date
        ? ` spanning from ${formatDateNice(first.date)} to ${formatDateNice(last.date)}`
        : '';
    sections.push(
      `This report traces ${sorted.length} data snapshots${dateRange}, comparing each version against the next in chronological order. ` +
      `Across all ${pairs.length} comparison steps, a total of ${totalCounts.total} change${totalCounts.total === 1 ? ' was' : 's were'} detected.`
    );

    if (totalCounts.total > 0) {
      // Find which step had the most changes
      let maxPair = pairs[0];
      for (const p of pairs) {
        if (p.diff.counts.total > maxPair.diff.counts.total) maxPair = p;
      }
      sections.push(
        `The biggest shift occurred between "${maxPair.from.title || 'an earlier version'}" and "${maxPair.to.title || 'a later version'}", with ${maxPair.diff.counts.total} changes in that step alone.`
      );
    }
  }

  // Per-pair stories
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const storyTitle = pairs.length > 1
      ? `── Step ${i + 1}: ${pair.from.title || 'Previous'} → ${pair.to.title || 'Next'} ──`
      : '';
    const body = buildPairStory(pair);
    sections.push(storyTitle ? `${storyTitle}\n\n${body}` : body);
  }

  // Grand closing for multi-pair
  if (pairs.length > 1 && totalCounts.total > 0) {
    const trend: string[] = [];
    if (totalCounts.changed > totalCounts.added + totalCounts.removed) {
      trend.push('The overall trend across the timeline is one of revision — the data structure stayed largely the same, but values were updated.');
    } else if (totalCounts.added > totalCounts.removed) {
      trend.push('Over time, the data has been growing with new fields appearing, suggesting the system is capturing more information.');
    } else if (totalCounts.removed > totalCounts.added) {
      trend.push('Over time, data has been trimmed down, with more fields removed than added.');
    }
    trend.push(`In total, ${totalCounts.total} changes were tracked across ${pairs.length} steps, providing a complete audit trail of how the data evolved.`);
    sections.push(trend.join(' '));
  }

  return sections.join('\n\n');
}

// ── Public: category labels for UI ──────────────────────────────────

export { CATEGORY_LABELS };

function formatDateNice(d: string): string {
  if (!d) return 'an unknown date';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}
