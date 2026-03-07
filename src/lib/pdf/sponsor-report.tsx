import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const PRIMARY = '#047857'
const ACCENT = '#D4A017'
const CHARCOAL = '#1C1917'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: CHARCOAL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  logoAccent: {
    color: ACCENT,
  },
  logoGreen: {
    color: PRIMARY,
  },
  subtitle: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: CHARCOAL,
    marginBottom: 6,
  },
  reportPeriod: {
    fontSize: 11,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '30%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
  },
  metricLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
})

export interface SponsorReportData {
  sponsorName: string
  sponsorArea: string
  sponsorVertical: string
  periodStart: string
  periodEnd: string
  metrics: {
    pageViews: number
    uniqueVisitors: number
    websiteClicks: number
    directionClicks: number
    phoneClicks: number
    bookingClicks: number
    reviewsReceived: number
    averageRating: number
    searchAppearances: number
  }
  topReferrers: Array<{ source: string; visits: number }>
  topSearchTerms: Array<{ term: string; count: number }>
  weeklyTrend: Array<{ week: string; views: number; leads: number }>
}

export function SponsorReport({ data }: { data: SponsorReportData }) {
  const totalLeads =
    data.metrics.websiteClicks +
    data.metrics.directionClicks +
    data.metrics.phoneClicks +
    data.metrics.bookingClicks

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              <Text style={styles.logoGreen}>Humble</Text>
              <Text style={styles.logoAccent}>Halal</Text>
            </Text>
            <Text style={styles.subtitle}>Sponsor Performance Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' as const }}>
            <Text style={{ fontSize: 9, color: '#666' }}>Generated: {new Date().toLocaleDateString('en-SG')}</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>humblehalal.sg</Text>
          </View>
        </View>

        {/* Report Title */}
        <Text style={styles.reportTitle}>{data.sponsorName}</Text>
        <Text style={styles.reportPeriod}>
          {data.sponsorVertical} · {data.sponsorArea} — {data.periodStart} to {data.periodEnd}
        </Text>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.pageViews.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Listing Page Views</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.uniqueVisitors.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Unique Visitors</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{totalLeads.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Lead Actions</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.websiteClicks.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Website Clicks</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.directionClicks.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Direction Clicks</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.phoneClicks.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Phone Clicks</Text>
            </View>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.reviewsReceived}</Text>
              <Text style={styles.metricLabel}>Reviews Received</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.averageRating.toFixed(1)}</Text>
              <Text style={styles.metricLabel}>Average Rating</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data.metrics.searchAppearances.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Search Appearances</Text>
            </View>
          </View>
        </View>

        {/* Top Referrers */}
        {data.topReferrers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Traffic Sources</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '60%' }]}>Source</Text>
              <Text style={[styles.tableHeaderText, { width: '40%' }]}>Visits</Text>
            </View>
            {data.topReferrers.map((ref, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>{ref.source}</Text>
                <Text style={[styles.tableCell, { width: '40%' }]}>{ref.visits.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top Search Terms */}
        {data.topSearchTerms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Search Terms</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '60%' }]}>Search Term</Text>
              <Text style={[styles.tableHeaderText, { width: '40%' }]}>Count</Text>
            </View>
            {data.topSearchTerms.map((term, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>{term.term}</Text>
                <Text style={[styles.tableCell, { width: '40%' }]}>{term.count.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Confidential — Prepared for {data.sponsorName}
          </Text>
          <Text style={styles.footerText}>humblehalal.sg</Text>
        </View>
      </Page>
    </Document>
  )
}
