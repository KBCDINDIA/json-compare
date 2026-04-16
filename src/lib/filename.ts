import type { JsonEntry } from './types';

function sanitize(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

function shortDate(d: string): string {
  if (!d) return '';
  try {
    const dt = new Date(d + 'T00:00:00');
    const mon = dt.toLocaleString('en', { month: 'short' });
    return `${mon}${dt.getDate()}`;
  } catch {
    return '';
  }
}

export function buildPdfFilename(sorted: JsonEntry[]): string {
  if (sorted.length < 2) return 'json-compare.pdf';

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const firstName = sanitize(first.title || first.remarks || 'V1') || 'V1';
  const lastName = sanitize(last.title || last.remarks || `V${sorted.length}`) || `V${sorted.length}`;

  let datePart = '';
  if (first.date && last.date && first.date !== last.date) {
    datePart = `_${shortDate(first.date)}-${shortDate(last.date)}`;
  } else if (first.date || last.date) {
    datePart = `_${shortDate(first.date || last.date)}`;
  }

  if (sorted.length === 2) {
    return `Compare_${firstName}_vs_${lastName}${datePart}.pdf`;
  }

  return `Compare_${firstName}_to_${lastName}_${sorted.length}versions${datePart}.pdf`;
}
