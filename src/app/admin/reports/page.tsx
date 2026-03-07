import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Sponsor Reports | AI Command Centre | HumbleHalal',
}

export default async function ReportsPage() {
  const supabase = await createClient()

  // Fetch available sponsors (listings with is_featured or premium status)
  const { data: sponsors } = await supabase
    .from('listings')
    .select('id, name, area, vertical, created_at')
    .eq('is_featured', true)
    .order('name', { ascending: true })

  // Fetch recent reports
  const { data: recentReports } = await supabase
    .from('ai_activity_log')
    .select('*')
    .eq('action', 'report:sponsor-generated')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsor Reports</h1>
          <p className="text-white/60 text-sm mt-1">
            Generate PDF performance reports for premium sponsors
          </p>
        </div>
      </div>

      {/* Generate New Report */}
      <div className="bg-charcoal rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent">add_circle</span>
          Generate New Report
        </h2>

        <form action="/api/admin/reports/generate" method="POST" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="sponsor_id" className="block text-sm text-white/70 mb-1">
                Sponsor
              </label>
              <select
                id="sponsor_id"
                name="sponsor_id"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              >
                <option value="">Select a sponsor...</option>
                {sponsors?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="period_start" className="block text-sm text-white/70 mb-1">
                Period Start
              </label>
              <input
                type="date"
                id="period_start"
                name="period_start"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label htmlFor="period_end" className="block text-sm text-white/70 mb-1">
                Period End
              </label>
              <input
                type="date"
                id="period_end"
                name="period_end"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-accent text-charcoal rounded-lg font-bold px-6 py-2 hover:bg-accent/90 transition-colors text-sm"
          >
            Generate PDF Report
          </button>
        </form>
      </div>

      {/* Recent Reports */}
      <div className="bg-charcoal rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Recent Reports
        </h2>

        {!recentReports?.length ? (
          <p className="text-white/40 text-sm">No reports generated yet.</p>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => {
              const meta = report.metadata as Record<string, string> | null
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {meta?.sponsor_name ?? 'Unknown Sponsor'}
                    </p>
                    <p className="text-xs text-white/40">
                      {meta?.period_start} — {meta?.period_end}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">
                      {new Date(report.created_at).toLocaleDateString('en-SG')}
                    </span>
                    {meta?.pdf_url && (
                      <a
                        href={meta.pdf_url}
                        className="text-accent text-sm hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sponsor Overview */}
      <div className="bg-charcoal rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">storefront</span>
          Active Sponsors ({sponsors?.length ?? 0})
        </h2>

        {!sponsors?.length ? (
          <p className="text-white/40 text-sm">No featured sponsors found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.map((s) => (
              <div
                key={s.id}
                className="rounded-lg bg-white/5 px-4 py-3 border border-white/5"
              >
                <p className="text-sm text-white font-medium">{s.name}</p>
                <p className="text-xs text-white/40">
                  {s.vertical} · {s.area}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  Since {new Date(s.created_at).toLocaleDateString('en-SG')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
