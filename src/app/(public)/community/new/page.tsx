'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { key: 'halal-food',  label: 'Halal Food' },
  { key: 'parenting',   label: 'Parenting' },
  { key: 'finance',     label: 'Islamic Finance' },
  { key: 'travel',      label: 'Travel' },
  { key: 'events',      label: 'Events' },
  { key: 'classifieds', label: 'Classifieds' },
  { key: 'general',     label: 'General' },
]

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Auth guard — redirect to login if not signed in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login?next=/community/new')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim() || !category) return
    setLoading(true)
    setError(null)

    const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5)

    // captchaToken: populated by Turnstile widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
    // Until the Turnstile widget is wired, pass null — the server skips verification when
    // TURNSTILE_SECRET_KEY is unset (dev), and rejects with 400 in production.
    const captchaToken: string | null = null

    const res = await fetch('/api/forum/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), category, tags: tagList, captchaToken }),
    })

    if (res.ok) {
      router.push('/community?submitted=1')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to submit. Please try again.')
      setLoading(false)
    }
  }

  if (!authChecked) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/community" className="hover:text-primary">Community</Link>
        <span className="mx-2">›</span>
        <span className="text-charcoal">New post</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-charcoal">Start a discussion</h1>
        <p className="text-charcoal/60 text-sm mt-1">Share a question, tip, or experience with the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Title <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What's your question or topic?"
            maxLength={150}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal
                       placeholder:text-charcoal/30 focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-charcoal/30 mt-1">{title.length}/150</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Category <span className="text-red-400">*</span></label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal
                       focus:outline-none focus:border-primary bg-white"
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Post <span className="text-red-400">*</span></label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share the details…"
            rows={8}
            maxLength={5000}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal
                       placeholder:text-charcoal/30 focus:outline-none focus:border-primary resize-none"
          />
          <p className="text-xs text-charcoal/30 mt-1">{body.length}/5000</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Tags <span className="text-charcoal/30 font-normal">(optional, comma-separated)</span></label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. chicken rice, muis, halal cert"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal
                       placeholder:text-charcoal/30 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Community guidelines */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">Community guidelines</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Be respectful and kind to other members</li>
            <li>No spam, self-promotion, or off-topic posts</li>
            <li>Posts are reviewed before appearing publicly</li>
          </ul>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !title.trim() || !body.trim() || !category}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl
                       text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Submitting…</>
              : <><span className="material-symbols-outlined text-sm">send</span>Submit post</>
            }
          </button>
          <Link href="/community" className="text-sm text-charcoal/50 hover:text-charcoal transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
