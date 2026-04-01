'use client'

import React from 'react'
import Link from 'next/link'

const CONTENT_TYPES = [
  { value: 'blog',        label: 'Blog Post',           hint: 'keyword + optional area' },
  { value: 'travel',      label: 'Travel Guide',        hint: 'use "destination" as keyword' },
  { value: 'newsletter',  label: 'Newsletter',          hint: 'keyword used as theme' },
  { value: 'meta',        label: 'Meta Description',    hint: 'keyword + optional area' },
]

type GenerateResult =
  | { kind: 'draft';    id: string; title: string; status: string }
  | { kind: 'meta';     title: string; description: string }
  | { kind: 'raw';      text: string }

export default function GenerateContentPage() {
  const [type, setType]               = React.useState('blog')
  const [keyword, setKeyword]         = React.useState('')
  const [area, setArea]               = React.useState('')
  const [generating, setGenerating]   = React.useState(false)
  const [result, setResult]           = React.useState<GenerateResult | null>(null)
  const [error, setError]             = React.useState('')

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return
    setGenerating(true)
    setError('')
    setResult(null)

    // Build params based on content type
    const params: Record<string, unknown> = { keyword: keyword.trim() }
    if (area.trim()) {
      if (type === 'travel') {
        params.destination = keyword.trim()       // travel uses "destination"
      } else {
        params.area = area.trim()
      }
    }

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      if (data.draft) {
        setResult({ kind: 'draft', id: data.draft.id, title: data.draft.title, status: data.draft.status })
      } else if (data.meta) {
        setResult({ kind: 'meta', title: data.meta.title, description: data.meta.description })
      } else {
        setResult({ kind: 'raw', text: JSON.stringify(data, null, 2) })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/content"
          className="text-white/40 text-xs hover:text-white transition-colors flex items-center gap-1 w-fit mb-3"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          Content Autopilot
        </Link>
        <h1 className="text-2xl font-extrabold text-white">Generate Content</h1>
        <p className="text-white/40 text-sm mt-1">
          Use AI to generate blog posts, travel guides, newsletters, and meta descriptions.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Content type */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wide mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors border ${
                    type === t.value
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span className="block font-bold">{t.label}</span>
                  <span className="block text-[10px] mt-0.5 opacity-60">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary keyword */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wide mb-2">
              {type === 'travel' ? 'Destination *' : 'Primary Keyword *'}
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
              placeholder={
                type === 'travel'
                  ? 'e.g. Kuala Lumpur'
                  : 'e.g. halal malay food tampines'
              }
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {/* Area (hidden for travel — destination doubles as keyword) */}
          {type !== 'travel' && (
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wide mb-2">
                Area <span className="normal-case font-normal text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Tampines, Bedok, Jurong"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={generating || !keyword.trim()}
            className="w-full flex items-center justify-center gap-2 bg-accent text-charcoal font-bold py-3 px-4 rounded-xl text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Generating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Generate
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              Generated Successfully
            </h2>
            {result.kind === 'draft' && (
              <Link
                href={`/admin/content/${result.id}`}
                className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                View Draft
              </Link>
            )}
          </div>

          {result.kind === 'draft' && (
            <div className="space-y-2">
              <p className="text-white/80 text-sm">
                <span className="text-white/40 mr-2">Title</span>
                {result.title}
              </p>
              <p className="text-white/80 text-sm">
                <span className="text-white/40 mr-2">Status</span>
                <span className="text-xs font-bold bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                  {result.status}
                </span>
              </p>
              <p className="text-white/30 text-xs mt-3">
                The draft has been saved automatically. Click &quot;View Draft&quot; to edit or publish it.
              </p>
            </div>
          )}

          {result.kind === 'meta' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1">Title tag</p>
                <p className="text-white text-sm bg-white/5 rounded-lg px-3 py-2 font-mono">
                  {result.title}
                </p>
                <p className={`text-xs mt-1 ${result.title.length > 60 ? 'text-red-400' : 'text-white/30'}`}>
                  {result.title.length} / 60 characters
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1">Meta description</p>
                <p className="text-white text-sm bg-white/5 rounded-lg px-3 py-2">
                  {result.description}
                </p>
                <p className={`text-xs mt-1 ${result.description.length > 160 ? 'text-red-400' : 'text-white/30'}`}>
                  {result.description.length} / 160 characters
                </p>
              </div>
            </div>
          )}

          {result.kind === 'raw' && (
            <pre className="text-white/70 text-xs bg-white/5 rounded-lg p-4 overflow-auto max-h-64 font-mono">
              {result.text}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
