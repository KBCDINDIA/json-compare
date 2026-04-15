import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DiffResult, Severity } from '../lib/types';
import { formatBytes, formatNow } from '../lib/format';
import { formatValue } from '../lib/humanize';

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
  subtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
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
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBox: {
    backgroundColor: COLORS.accentSoft,
    border: `1pt solid ${COLORS.accent}`,
    borderRadius: 4,
    padding: 8,
    minWidth: 90,
  },
  summaryLabel: { fontSize: 9, color: COLORS.muted },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginTop: 2,
  },
  meta: { fontSize: 9, color: COLORS.muted, marginBottom: 4 },
  group: {
    backgroundColor: COLORS.surface,
    border: `1pt solid ${COLORS.edge}`,
    borderRadius: 6,
    marginBottom: 10,
    padding: 10,
  },
  groupHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1pt solid ${COLORS.edge}`,
  },
  entry: {
    marginBottom: 6,
    paddingBottom: 4,
  },
  entryLine: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  sentence: { fontSize: 10, flex: 1, color: COLORS.ink },
  beforeAfter: {
    marginTop: 4,
    marginLeft: 0,
    flexDirection: 'row',
    gap: 6,
  },
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
  valText: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: COLORS.ink,
  },
  topItem: {
    fontSize: 10,
    marginBottom: 4,
    color: COLORS.ink,
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
    padding: 20,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
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

interface Props {
  result: DiffResult;
  includeAll?: boolean;
}

const MAX_ENTRIES_DEFAULT = 200;

export function ReportPdf({ result, includeAll = false }: Props) {
  const limit = includeAll ? Infinity : MAX_ENTRIES_DEFAULT;
  let shown = 0;
  const truncated = !includeAll && result.entries.length > MAX_ENTRIES_DEFAULT;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>JSON Comparison Report</Text>
          <Text style={styles.subtitle}>Generated on {formatNow()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total changes</Text>
              <Text style={styles.summaryValue}>{result.counts.total}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Added</Text>
              <Text style={styles.summaryValue}>{result.counts.added}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Removed</Text>
              <Text style={styles.summaryValue}>{result.counts.removed}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Changed</Text>
              <Text style={styles.summaryValue}>{result.counts.changed}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Type changed</Text>
              <Text style={styles.summaryValue}>
                {result.counts.typeChanged}
              </Text>
            </View>
          </View>
          <Text style={[styles.meta, { marginTop: 10 }]}>
            JSON A: {formatBytes(result.stats.aBytes)} • {result.stats.aFields}{' '}
            fields
          </Text>
          <Text style={styles.meta}>
            JSON B: {formatBytes(result.stats.bBytes)} • {result.stats.bFields}{' '}
            fields
          </Text>
        </View>

        {result.topFindings.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>★ Top findings</Text>
            {result.topFindings.map((e, i) => (
              <Text key={i} style={styles.topItem}>
                • [{sevLabel(e.severity)}] {e.humanPath}: {e.sentence}
              </Text>
            ))}
          </View>
        )}

        {result.entries.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.noDiff}>
              No differences found. Both JSON documents match.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.cardTitle, { marginTop: 6 }]}>
              Detailed changes
            </Text>
            {result.groups.map((g, gi) => {
              if (shown >= limit) return null;
              const entriesToShow = g.entries.slice(0, limit - shown);
              shown += entriesToShow.length;
              return (
                <View key={gi} style={styles.group} wrap={false}>
                  <Text style={styles.groupHeader}>{g.parentPath}</Text>
                  {entriesToShow.map((e, ei) => (
                    <View key={ei} style={styles.entry}>
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
                  Showing {MAX_ENTRIES_DEFAULT} most important of{' '}
                  {result.entries.length} changes. Use "Include all changes" in
                  the app to export the full diff.
                </Text>
              </View>
            )}
          </>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `JSON Compare  •  Generated in your browser  •  Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
