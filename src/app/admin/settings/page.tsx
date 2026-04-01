import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CRON_JOBS = [
  { name: 'MUIS Cert Sync',        schedule: 'Weekly Sun 2am SGT',   endpoint: '/api/cron/muis-sync',        icon: 'verified' },
  { name: 'Google Places Refresh', schedule: 'Monthly 1st 4am SGT',  endpoint: '/api/cron/places-refresh',   icon: 'place' },
  { name: 'Listing Freshness',     schedule: 'Weekly Mon 3am SGT',   endpoint: '/api/cron/freshness-check',  icon: 'refresh' },
  { name: 'Closure Detection',     schedule: 'Monthly 15th 4am SGT', endpoint: '/api/cron/closure-detect',   icon: 'store_mall_directory' },
  { name: 'Newsletter Draft',      schedule: 'Weekly Wed 6am SGT',   endpoint: '/api/cron/newsletter-draft', icon: 'mail' },
  { name: 'SEO Audit (500 pages)', schedule: 'Daily 5am SGT',        endpoint: '/api/cron/seo-audit',        icon: 'search_insights' },
  { name: 'GSC Data Pull',         schedule: 'Daily 6am SGT',        endpoint: '/api/cron/gsc-pull',         icon: 'query_stats' },
  { name: 'Ahrefs Data Pull',      schedule: 'Weekly Mon 6am SGT',   endpoint: '/api/cron/ahrefs-pull',      icon: 'bar_chart' },
  { name: 'Morning Briefing',      schedule: 'Daily 7am SGT',        endpoint: '/api/cron/morning-briefing', icon: 'wb_sunny' },
  { name: 'Analytics Rollup',      schedule: 'Daily 1am SGT',        endpoint: '/api/cron/analytics-rollup', icon: 'analytics' },
]

const ENV_KEYS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',         label: 'Supabase URL',              public: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',    label: 'Supabase Anon Key',         public: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',        label: 'Supabase Service Role Key', public: false },
  { key: 'ANTHROPIC_API_KEY',                label: 'Anthropic API Key',          public: false },
  { key: 'STRIPE_SECRET_KEY',                label: 'Stripe Secret Key',          public: false },
  { key: 'STRIPE_WEBHOOK_SECRET',            label: 'Stripe Webhook Secret',      public: false },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key',  public: true },
  { key: 'GOOGLE_MAPS_API_KEY',              label: 'Google Maps API Key',        public: false },
  { key: 'RESEND_API_KEY',                   label: 'Resend API Key',             public: false },
  { key: 'BEEHIIV_API_KEY',                  label: 'Beehiiv API Key',            public: false },
  { key: 'BEEHIIV_PUBLICATION_ID',           label: 'Beehiiv Publication ID',     public: false },
  { key: 'NEXT_PUBLIC_POSTHOG_KEY',          label: 'PostHog Key',               public: true },
  { key: 'NEXT_PUBLIC_POSTHOG_HOST',         label: 'PostHog Host',              public: true },
  { key: 'SENTRY_DSN',                       label: 'Sentry DSN',                public: false },
  { key: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',    label: 'GA Measurement ID',         public: true },
]

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const db = supabase as any

  // AI cost log — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: costRaw } = (await db
    .from('ai_cost_log')
    .select('operation, model, input_tokens, output_tokens, cost_usd, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(100)) as any

  const costLogs: any[] = costRaw ?? []

  const totalCost = costLogs.reduce((s: number, r: any) => s + (r.cost_usd ?? 0), 0)
  const totalInputTokens = costLogs.reduce((s: number, r: any) => s + (r.input_tokens ?? 0), 0)
  const totalOutputTokens = costLogs.reduce((s: number, r: any) => s + (r.output_tokens ?? 0), 0)

  // Group cost by model
  const costByModel: Record<string, number> = {}
  for (const row of costLogs) {
    const m = row.model ?? 'unknown'
    costByModel[m] = (costByModel[m] ?? 0) + (row.cost_usd ?? 0)
  }

  // Recent AI activity
  const { data: activityRaw } = (await db
    .from('ai_activity_log')
    .select('operation, status, summary, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(20)) as any

  const activities: any[] = activityRaw ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <header>
        <h1 className="text-2xl font-extrabold text-charcoal">Settings</h1>
        <p className="text-charcoal/50 text-sm mt-1">
          API key status, cron schedule, and AI cost tracking
        </p>
      </header>

      {/* Environment / API Keys */}
      <section>
        <h2 className="text-base font-bold text-charcoal mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">key</span>
          Environment Variables
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                  Variable
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden sm:table-cell">
                  Scope
                </th>
                <th className="text-center px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ENV_KEYS.map(({ key, label, public: isPublic }) => {
                const set = !!process.env[key]
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal text-xs">{label}</p>
                      <p className="text-charcoal/30 text-xs font-mono">{key}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isPublic
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-charcoal/60'
                        }`}
                      >
                        {isPublic ? 'Public' : 'Server'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {set ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-bold">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Set
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-bold">
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cron schedule */}
      <section>
        <h2 className="text-base font-bold text-charcoal mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">schedule</span>
          Cron Job Schedule
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                  Job
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden sm:table-cell">
                  Schedule
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden md:table-cell">
                  Endpoint
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CRON_JOBS.map((job) => (
                <tr key={job.endpoint} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base shrink-0">
                        {job.icon}
                      </span>
                      <span className="font-medium text-charcoal text-xs">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-charcoal/60">
                    {job.schedule}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs text-charcoal/50 font-mono">{job.endpoint}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Cost — 30 days */}
      <section>
        <h2 className="text-base font-bold text-charcoal mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">payments</span>
          AI Cost (Last 30 Days)
        </h2>

        {/* Cost summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Total cost', value: `$${totalCost.toFixed(4)}`, icon: 'attach_money' },
            { label: 'API calls', value: costLogs.length.toLocaleString(), icon: 'api' },
            { label: 'Input tokens', value: `${(totalInputTokens / 1000).toFixed(1)}K`, icon: 'input' },
            { label: 'Output tokens', value: `${(totalOutputTokens / 1000).toFixed(1)}K`, icon: 'output' },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-lg">{card.icon}</span>
                <span className="text-xs text-charcoal/50">{card.label}</span>
              </div>
              <p className="text-lg font-extrabold text-charcoal">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Cost by model */}
        {Object.keys(costByModel).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-bold text-charcoal/50 uppercase tracking-wider mb-3">
              Cost by model
            </h3>
            <div className="space-y-2">
              {Object.entries(costByModel)
                .sort(([, a], [, b]) => b - a)
                .map(([model, cost]) => {
                  const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0
                  return (
                    <div key={model} className="flex items-center gap-3">
                      <span className="text-xs text-charcoal/60 font-mono w-48 truncate shrink-0">
                        {model}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-charcoal w-20 text-right shrink-0">
                        ${cost.toFixed(4)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Recent cost log */}
        {costLogs.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/20 block mb-2">
              receipt_long
            </span>
            <p className="text-charcoal/40 text-sm">No AI cost data in the last 30 days.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden sm:table-cell">
                    Model
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden md:table-cell">
                    Tokens in/out
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden lg:table-cell">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {costLogs.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-charcoal font-medium capitalize">
                      {row.operation?.replace(/_/g, ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs text-charcoal/50 font-mono">{row.model ?? '—'}</code>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-charcoal/50">
                      {(row.input_tokens ?? 0).toLocaleString()} / {(row.output_tokens ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-charcoal">
                        ${(row.cost_usd ?? 0).toFixed(5)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-xs text-charcoal/40">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString('en-SG', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent AI Activity */}
      <section>
        <h2 className="text-base font-bold text-charcoal mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">history</span>
          Recent AI Activity
        </h2>
        {activities.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-charcoal/40 text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
            {activities.map((act: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                    act.status === 'success' ? 'text-primary' : 'text-red-500'
                  }`}
                >
                  {act.status === 'success' ? 'check_circle' : 'error'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-charcoal capitalize">
                    {act.operation?.replace(/_/g, ' ') ?? '—'}
                  </p>
                  {act.summary && (
                    <p className="text-xs text-charcoal/40 truncate">{act.summary}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {act.duration_ms != null && (
                    <p className="text-xs text-charcoal/40">{act.duration_ms}ms</p>
                  )}
                  <p className="text-xs text-charcoal/30">
                    {act.created_at
                      ? new Date(act.created_at).toLocaleDateString('en-SG', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
