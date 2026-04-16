import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type {
  DiffResult,
  Severity,
  TimelinePair,
  TimelineResult,
} from '../lib/types';
import { formatNow } from '../lib/format';
import { formatValue } from '../lib/humanize';
import { buildTimelineStory } from '../lib/story';
import {
  buildComparisonData,
  getCellStatus,
  type CellStatus,
} from '../lib/flatten';

const COLORS = {
  bg: '#FFFDF7',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  accent: '#FCD34D',
  accentSoft: '#FEF3C7',
  ink: '#1E293B',
  muted: '#64748B',
  edge: '#E2E8F0',
  addBg: '#DCFCE7',
  addFg: '#15803D',
  remBg: '#FEE2E2',
  remFg: '#B91C1C',
  chgBg: '#FEF3C7',
  chgFg: '#92400E',
  typBg: '#FFEDD5',
  typFg: '#C2410C',
  movBg: '#DBEAFE',
  movFg: '#1D4ED8',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 40,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottom: `2pt solid ${COLORS.primary}`,
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  subtitle: { fontSize: 10, color: COLORS.muted, marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    border: `1pt solid ${COLORS.edge}`,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: COLORS.ink,
  },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryBox: {
    backgroundColor: COLORS.accentSoft,
    border: `1pt solid ${COLORS.accent}`,
    borderRadius: 4,
    padding: 8,
    minWidth: 80,
  },
  summaryLabel: { fontSize: 8, color: COLORS.muted },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginTop: 2,
  },
  meta: { fontSize: 9, color: COLORS.muted, marginBottom: 4 },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  timelineNum: {
    width: 18,
    height: 14,
    backgroundColor: COLORS.primary,
    color: COLORS.surface,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderRadius: 2,
    paddingTop: 2,
  },
  timelineBody: { flex: 1 },
  timelineTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
  },
  timelineMeta: { fontSize: 9, color: COLORS.muted, marginTop: 1 },
  pairHeader: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 4,
    padding: 8,
    marginTop: 16,
    marginBottom: 8,
    border: `1pt solid ${COLORS.primary}`,
  },
  pairTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  pairSub: { fontSize: 9, color: COLORS.ink, marginTop: 2 },
  group: {
    backgroundColor: COLORS.surface,
    border: `1pt solid ${COLORS.edge}`,
    borderRadius: 6,
    marginBottom: 10,
    padding: 10,
  },
  groupHeaderWrap: {
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1pt solid ${COLORS.edge}`,
  },
  groupHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  entry: { marginBottom: 6, paddingBottom: 4 },
  entryLine: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  sentence: { fontSize: 10, flex: 1, color: COLORS.ink },
  beforeAfter: { marginTop: 4, flexDirection: 'row', gap: 6 },
  beforeBox: {
    flex: 1,
    backgroundColor: COLORS.remBg,
    padding: 4,
    borderRadius: 3,
  },
  afterBox: {
    flex: 1,
    backgroundColor: COLORS.addBg,
    padding: 4,
    borderRadius: 3,
  },
  smallLabel: { fontSize: 7, color: COLORS.muted, marginBottom: 1 },
  valText: { fontSize: 9, fontFamily: 'Courier', color: COLORS.ink },
  topItem: { fontSize: 10, marginBottom: 4, color: COLORS.ink },
  tableSection: {
    marginTop: 20,
    borderTop: `2pt solid ${COLORS.primary}`,
    paddingTop: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  tableSub: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.edge}`,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    borderBottom: `1pt solid ${COLORS.edge}`,
  },
  tableFieldCell: {
    width: '30%',
    padding: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    borderRight: `0.5pt solid ${COLORS.edge}`,
  },
  tableValueCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: 'Courier',
    color: COLORS.ink,
    borderRight: `0.5pt solid ${COLORS.edge}`,
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    borderRight: `0.5pt solid ${COLORS.edge}`,
  },
  storySection: {
    marginTop: 20,
    borderTop: `2pt solid ${COLORS.primary}`,
    paddingTop: 12,
  },
  storyTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  storyStepHeader: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 6,
    borderTop: `1pt solid ${COLORS.edge}`,
    paddingTop: 6,
  },
  storyParagraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.ink,
    marginBottom: 8,
  },
  storyBullet: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.ink,
    marginBottom: 4,
    paddingLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.muted,
    textAlign: 'center',
    borderTop: `1pt solid ${COLORS.edge}`,
    paddingTop: 6,
  },
  noDiff: {
    padding: 12,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 10,
  },
});

function badgeStyle(sev: Severity) {
  switch (sev) {
    case 'added':
      return { backgroundColor: COLORS.addBg, color: COLORS.addFg };
    case 'removed':
      return { backgroundColor: COLORS.remBg, color: COLORS.remFg };
    case 'changed':
      return { backgroundColor: COLORS.chgBg, color: COLORS.chgFg };
    case 'typeChanged':
      return { backgroundColor: COLORS.typBg, color: COLORS.typFg };
    case 'moved':
      return { backgroundColor: COLORS.movBg, color: COLORS.movFg };
  }
}

function sevLabel(sev: Severity) {
  return {
    added: 'ADDED',
    removed: 'REMOVED',
    changed: 'CHANGED',
    typeChanged: 'TYPE',
    moved: 'MOVED',
  }[sev];
}

function formatDate(d: string): string {
  if (!d) return 'no date';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

interface Props {
  result: TimelineResult;
  includeAll?: boolean;
}

const MAX_ENTRIES_PER_PAIR = 150;

export function ReportPdf({ result, includeAll = false }: Props) {
  const { totalCounts, sorted, pairs } = result;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.primary, letterSpacing: 2, marginBottom: 2 }}>
            KBCD INDIA
          </Text>
          <Text style={styles.title}>JSON Comparison Report</Text>
          <Text style={styles.subtitle}>
            Internal Data Comparison System • Generated on {formatNow()}
          </Text>
          <Text style={styles.subtitle}>
            {sorted.length} entries • {pairs.length} date-wise comparison
            {pairs.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total changes</Text>
              <Text style={styles.summaryValue}>{totalCounts.total}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Added</Text>
              <Text style={styles.summaryValue}>{totalCounts.added}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Removed</Text>
              <Text style={styles.summaryValue}>{totalCounts.removed}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Changed</Text>
              <Text style={styles.summaryValue}>{totalCounts.changed}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Type changed</Text>
              <Text style={styles.summaryValue}>
                {totalCounts.typeChanged}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline (sorted by date)</Text>
          {sorted.map((e, i) => (
            <View key={e.id} style={styles.timelineItem}>
              <Text style={styles.timelineNum}>{i + 1}</Text>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTitle}>
                  {e.title || `Entry ${i + 1}`}
                </Text>
                <Text style={styles.timelineMeta}>
                  {formatDate(e.date)}
                </Text>
                {e.remarks ? (
                  <Text style={styles.timelineMeta}>{e.remarks}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {pairs.map((pair, i) => (
          <PairBlock
            key={i}
            pair={pair}
            index={i}
            includeAll={includeAll}
          />
        ))}

        <ComparisonTablePdf result={result} />

        <StorySection result={result} />

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `KBCD INDIA  •  Internal Data Comparison System  •  Confidential  •  Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

function PairBlock({
  pair,
  index,
  includeAll,
}: {
  pair: TimelinePair;
  index: number;
  includeAll: boolean;
}) {
  const { from, to, diff } = pair;
  const limit = includeAll ? Infinity : MAX_ENTRIES_PER_PAIR;
  let shown = 0;
  const truncated = !includeAll && diff.entries.length > MAX_ENTRIES_PER_PAIR;

  return (
    <View>
      <View style={styles.pairHeader} wrap={false}>
        <Text style={styles.pairTitle}>
          Step {index + 1}: {from.title || 'Untitled'} → {to.title || 'Untitled'}
        </Text>
        <Text style={styles.pairSub}>
          {formatDate(from.date)} → {formatDate(to.date)} • {diff.counts.total}{' '}
          change{diff.counts.total === 1 ? '' : 's'} ({diff.counts.added} added,{' '}
          {diff.counts.removed} removed, {diff.counts.changed} changed,{' '}
          {diff.counts.typeChanged} type)
        </Text>
        {(from.remarks || to.remarks) && (
          <Text style={[styles.pairSub, { marginTop: 3 }]}>
            {from.remarks ? `From: ${from.remarks}` : ''}
            {from.remarks && to.remarks ? '  •  ' : ''}
            {to.remarks ? `To: ${to.remarks}` : ''}
          </Text>
        )}
      </View>

      {diff.topFindings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>★ Top findings</Text>
          {diff.topFindings.map((e, i) => (
            <Text key={i} style={styles.topItem}>
              • [{sevLabel(e.severity)}] {e.humanPath}: {e.sentence}
            </Text>
          ))}
        </View>
      )}

      {diff.entries.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.noDiff}>
            No differences between these two entries.
          </Text>
        </View>
      ) : (
        <>
          {diff.groups.map((g, gi) => {
            if (shown >= limit) return null;
            const entriesToShow = g.entries.slice(0, limit - shown);
            shown += entriesToShow.length;
            return (
              <View key={gi} style={styles.group}>
                <View style={styles.groupHeaderWrap} wrap={false}>
                  <Text style={styles.groupHeader}>{g.parentPath}</Text>
                </View>
                {entriesToShow.map((e, ei) => (
                  <View key={ei} style={styles.entry} wrap={false}>
                    <View style={styles.entryLine}>
                      <Text style={[styles.badge, badgeStyle(e.severity)]}>
                        {sevLabel(e.severity)}
                      </Text>
                      <Text style={styles.sentence}>{e.sentence}</Text>
                    </View>
                    {(e.severity === 'changed' ||
                      e.severity === 'typeChanged') && (
                      <View style={styles.beforeAfter}>
                        <View style={styles.beforeBox}>
                          <Text style={styles.smallLabel}>Before</Text>
                          <Text style={styles.valText}>
                            {formatValue(e.oldValue)}
                          </Text>
                        </View>
                        <View style={styles.afterBox}>
                          <Text style={styles.smallLabel}>After</Text>
                          <Text style={styles.valText}>
                            {formatValue(e.newValue)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
          {truncated && (
            <View style={styles.card}>
              <Text style={styles.meta}>
                Showing {MAX_ENTRIES_PER_PAIR} most important of{' '}
                {diff.entries.length} changes in this step. Enable "Include all
                changes" in the app to export the full diff.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const CELL_BG: Record<CellStatus, string> = {
  same: COLORS.surface,
  changed: COLORS.chgBg,
  added: COLORS.addBg,
  removed: COLORS.remBg,
  'type-changed': COLORS.typBg,
  absent: '#F8FAFC',
};

function ComparisonTablePdf({ result }: { result: TimelineResult }) {
  const data = buildComparisonData(result.sorted);
  const rows = data.changedRows;

  if (rows.length === 0 || data.headers.length < 2) return null;

  const colCount = data.headers.length;
  const valueColWidth = `${Math.floor(70 / colCount)}%`;

  return (
    <View style={styles.tableSection}>
      <Text style={styles.tableTitle}>Side-by-Side Comparison Table</Text>
      <Text style={styles.tableSub}>
        Showing {rows.length} fields with differences (out of {data.rows.length}{' '}
        total fields). Unchanged fields are hidden.
      </Text>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, backgroundColor: COLORS.chgBg, borderRadius: 1 }} />
          <Text style={{ fontSize: 7, color: COLORS.muted }}>Changed</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, backgroundColor: COLORS.addBg, borderRadius: 1 }} />
          <Text style={{ fontSize: 7, color: COLORS.muted }}>Added</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, backgroundColor: COLORS.remBg, borderRadius: 1 }} />
          <Text style={{ fontSize: 7, color: COLORS.muted }}>Removed</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, backgroundColor: COLORS.typBg, borderRadius: 1 }} />
          <Text style={{ fontSize: 7, color: COLORS.muted }}>Type changed</Text>
        </View>
      </View>

      {/* Header row */}
      <View style={styles.tableHeaderRow} wrap={false}>
        <View style={[styles.tableFieldCell, { width: '30%', backgroundColor: COLORS.accentSoft }]}>
          <Text>Field</Text>
        </View>
        {data.headers.map((h, i) => (
          <View key={i} style={[styles.tableHeaderCell, { width: valueColWidth }]}>
            <Text>{h.title}</Text>
            {h.date ? <Text style={{ fontSize: 7, color: COLORS.muted, fontFamily: 'Helvetica' }}>{formatDate(h.date)}</Text> : null}
          </View>
        ))}
      </View>

      {/* Data rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow} wrap={false}>
          <View style={[styles.tableFieldCell, { width: '30%', paddingLeft: 4 + row.indent * 6 }]}>
            <Text>{row.humanLabel}</Text>
          </View>
          {Array.from({ length: colCount }, (_, ci) => {
            const status = getCellStatus(row, ci);
            const val = row.values[ci];
            return (
              <View
                key={ci}
                style={[
                  styles.tableValueCell,
                  { width: valueColWidth, backgroundColor: CELL_BG[status] },
                ]}
              >
                <Text style={status === 'removed' ? { textDecoration: 'line-through', color: COLORS.muted } : {}}>
                  {val ?? '—'}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function StorySection({ result }: { result: TimelineResult }) {
  const story = buildTimelineStory(result);
  const paragraphs = story.split('\n\n').filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <View style={styles.storySection}>
      <Text style={styles.storyTitle}>Change Story</Text>
      {paragraphs.map((p, i) => {
        // Step headers
        if (p.startsWith('──')) {
          return (
            <Text key={i} style={styles.storyStepHeader}>
              {p.replace(/─/g, '').trim()}
            </Text>
          );
        }
        // Bullet lists
        if (p.includes('\n•')) {
          const lines = p.split('\n');
          return (
            <View key={i}>
              {lines[0] && (
                <Text style={[styles.storyParagraph, { fontFamily: 'Helvetica-Bold' }]}>
                  {lines[0]}
                </Text>
              )}
              {lines.slice(1).map((line, j) => (
                <Text key={j} style={styles.storyBullet}>
                  {line}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} style={styles.storyParagraph}>
            {p}
          </Text>
        );
      })}
    </View>
  );
}

// suppress unused import
void ({} as DiffResult);
