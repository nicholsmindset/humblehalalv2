import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCORE_COLOR = (score: number) =>
  score >= 80 ? 'text-primary' : score >= 60 ? 'text-amber-500' : 'text-red-500'

const SCORE_BG = (score: number) =>
  score >= 80 ? 'bg-primary/10' : score >= 60 ? 'bg-amber-50' : 'bg-red-50'

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const supabase = await createClient()
  const db = supabase as any

  const page = Math.max(1, Number(searchParams.page ?? 1))
  const PAGE_SIZE = 30
  const offset = (page - 1) * PAGE_SIZE

  const pageType = searchParams.page_type ?? ''
  const minScore = Number(searchParams.min_score ?? 0)
  const maxScore = Number(searchParams.max_score ?? 100)

  let query = db
    .from('ai_seo_audit')
    .select('*', { count: 'exact' })
    .gte('score', minScore)
    .lte('score', maxScore)
    .order('score', { ascending: true })
    .order('audited_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (pageType) query = query.eq('page_type', pageType)

  const { data: rows, count } = (await query) as any

  const audits: any[] = rows ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Summary stats
  const { data: statsRaw } = (await db
    .from('ai_seo_audit')
    .select('score, has_schema, issues')
    .limit(2000)) as any
  const stats = (statsRaw ?? []) as any[]
  const avgScore =
    stats.length > 0
      ? Math.round(stats.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / stats.length)
      : 0
  const noSchema = stats.filter((r: any) => !r.has_schema).length
  const critical = stats.filter((r: any) => (r.score ?? 100) < 60).length

  function buildUrl(params: Record<string, string | number | undefined>) {
    const base = new URLSearchParams()
    const merged = { page: '1', page_type: pageType, min_score: String(minScore), max_score: String(maxScore), ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== '0' && !(k === 'min_score' && v === '0') && !(k === 'max_score' && v === '100')) {
        base.set(k, String(v))
      }
    })
    const qs = base.toString()
    return `/admin/seo${qs ? `?${qs}` : ''}`
  }

  const pageTypes = ['food', 'mosque', 'event', 'classified', 'prayer_room', 'blog', 'static']

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold text-charcoal">SEO Audit Engine</h1>
        <p className="text-charcoal/50 text-sm mt-1">
          Programmatic SEO health across all {total.toLocaleString()} audited pages
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pages audited', value: stats.length.toLocaleString(), icon: 'article', color: 'text-primary' },
          { label: 'Avg SEO score', value: `${avgScore}/100`, icon: 'trending_up', color: SCORE_COLOR(avgScore) },
          { label: 'No schema markup', value: noSchema.toLocaleString(), icon: 'code_off', color: 'text-amber-500' },
          { label: 'Critical (<60)', value: critical.toLocaleString(), icon: 'warning', color: 'text-red-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-xl ${card.color}`}>{card.icon}</span>
              <span className="text-xs text-charcoal/50 font-medium">{card.label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="text-xs font-medium text-charcoal/50 block mb-1">Page type</label>
          <select
            name="page_type"
            defaultValue={pageType}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-charcoal bg-white"
          >
            <option value="">All types</option>
            {pageTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-charcoal/50 block mb-1">Score range</label>
          <div className="flex items-center gap-2">
            <input
              name="min_score"
              type="number"
              defaultValue={minScore || ''}
              min={0}
              max={100}
              placeholder="Min"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 text-charcoal bg-white"
            />
            <span className="text-charcoal/40 text-sm">–</span>
            <input
              name="max_score"
              type="number"
              defaultValue={maxScore === 100 ? '' : maxScore}
              min={0}
              max={100}
              placeholder="Max"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 text-charcoal bg-white"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Filter
        </button>
        <a
          href="/admin/seo"
          className="text-sm text-charcoal/40 hover:text-charcoal transition-colors py-2"
        >
          Reset
        </a>
      </form>

      {/* Audit table */}
      {audits.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-charcoal/20 block mb-3">
            find_in_page
          </span>
          <p className="text-charcoal/40 font-medium">No audit data yet</p>
          <p className="text-charcoal/30 text-sm mt-1">
            Run the SEO audit cron job to populate this table.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden lg:table-cell">
                    Title / H1
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden sm:table-cell">
                    Schema
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-charcoal/50 uppercase tracking-wider hidden xl:table-cell">
                    Audited
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {audits.map((audit: any) => {
                  const score = audit.score ?? 0
                  const issues = Array.isArray(audit.issues)
                    ? audit.issues
                    : typeof audit.issues === 'object' && audit.issues
                    ? Object.values(audit.issues)
                    : []
                  const issueCount = issues.length

                  return (
                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <a
                          href={audit.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block text-xs"
                          title={audit.page_url}
                        >
                          {audit.page_url?.replace(/^https?:\/\/[^/]+/, '') ?? '—'}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-gray-100 text-charcoal/60 px-2 py-0.5 rounded-full capitalize">
                          {audit.page_type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell max-w-sm">
                        <p className="text-xs text-charcoal truncate" title={audit.title_tag ?? ''}>
                          {audit.title_tag || <span className="text-red-400 italic">Missing title</span>}
                        </p>
                        <p className="text-xs text-charcoal/40 truncate" title={audit.h1 ?? ''}>
                          {audit.h1 || <span className="italic">No H1</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {audit.has_schema ? (
                          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-red-400 text-base">cancel</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {issueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-bold">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            {issueCount}
                          </span>
                        ) : (
                          <span className="text-xs text-primary font-bold">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs font-extrabold px-2 py-1 rounded-lg ${SCORE_BG(score)} ${SCORE_COLOR(score)}`}
                        >
                          {score}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-charcoal/40">
                        {audit.audited_at
                          ? new Date(audit.audited_at).toLocaleDateString('en-SG', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-charcoal/40">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
                {total.toLocaleString()} pages
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <a
                    href={buildUrl({ page: page - 1 })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-charcoal hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </a>
                )}
                <span className="text-xs text-charcoal/50">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={buildUrl({ page: page + 1 })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-charcoal hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
