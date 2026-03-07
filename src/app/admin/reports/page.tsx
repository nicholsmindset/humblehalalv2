'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

const REPORT_TYPES = [
  {
    id: 'sponsor',
    label: 'Sponsor Performance Report',
    icon: 'campaign',
    description: 'Traffic, impressions, click-throughs, and ROI for featured/sponsored listings.',
  },
  {
    id: 'listings',
    label: 'Listings Overview Report',
    icon: 'store',
    description: 'All active listings by vertical with halal status, rating, and review counts.',
  },
  {
    id: 'analytics',
    label: 'Analytics Summary Report',
    icon: 'bar_chart',
    description: 'Top pages, search terms, device breakdown, and user journeys for the period.',
  },
  {
    id: 'seo',
    label: 'SEO Audit Report',
    icon: 'search',
    description: 'Pages missing meta tags, schema issues, and pSEO health across all verticals.',
  },
]

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'mtd', label: 'Month to Date' },
]

export default function AdminReportsPage() {
  const [selectedType, setSelectedType] = useState('sponsor')
  const [dateRange, setDateRange] = useState('30d')
  const [sponsorName, setSponsorName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, dateRange, sponsorName }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Failed to generate report' }))
        throw new Error(msg ?? 'Failed to generate report')
      }

      // Download the PDF
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `humblehalal-${selectedType}-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setLastGenerated(new Date().toLocaleTimeString('en-SG'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Sponsor Report Generator</h1>
        <p className="text-white/50 text-sm">
          Generate and download PDF performance reports for sponsors and stakeholders.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Report type selector */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Report Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => setSelectedType(rt.id)}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  selectedType === rt.id
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">{rt.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{rt.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{rt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date range + sponsor name */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/60 block mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-charcoal">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedType === 'sponsor' && (
              <div>
                <label className="text-xs font-medium text-white/60 block mb-2">
                  Sponsor / Brand Name <span className="text-white/30">(optional)</span>
                </label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="e.g. Al-Barakah Foods"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-accent text-charcoal font-bold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Generating PDF…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">download</span>
                Generate & Download PDF
              </>
            )}
          </button>

          {lastGenerated && !generating && (
            <p className="text-white/40 text-xs">
              <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
              Last generated at {lastGenerated}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}
      </div>

      {/* Report format info */}
      <div className="mt-10 bg-white/5 rounded-xl p-6">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Report Contents</h2>
        <ul className="space-y-2 text-sm text-white/50">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-sm">check</span>
            HumbleHalal branded cover page with logo and date range
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-sm">check</span>
            Key metrics summary (impressions, clicks, CTR, conversions)
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-sm">check</span>
            Top performing listings and search terms
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-sm">check</span>
            Audience breakdown (area, device, source channel)
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-sm">check</span>
            Period-over-period comparison (where data is available)
          </li>
        </ul>
      </div>
    </div>
  )
}
