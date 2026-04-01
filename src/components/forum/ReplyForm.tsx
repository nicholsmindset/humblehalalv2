'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  postId: string
}

export function ReplyForm({ postId }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    // captchaToken: to be populated by a Turnstile widget when
    // NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured. Passing null lets
    // the server skip verification in dev (no secret set) while the
    // production deployment can layer in the widget without a breaking change.
    const captchaToken: string | null = null

    const res = await fetch('/api/forum/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, body: body.trim(), captchaToken }),
    })

    if (res.ok) {
      setSubmitted(true)
      setBody('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to post reply. Please try again.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-primary text-3xl block mb-2">check_circle</span>
        <p className="font-medium text-charcoal text-sm">Reply submitted for review</p>
        <p className="text-xs text-charcoal/50 mt-1">Your reply will appear once approved by our team.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-charcoal text-sm mb-4">Add a reply</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your thoughts respectfully…"
          rows={5}
          maxLength={2000}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal
                     placeholder:text-charcoal/30 focus:outline-none focus:border-primary resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-charcoal/30">{body.length}/2000</p>
          <div className="flex items-center gap-3">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl
                         text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">send</span>
              )}
              Post reply
            </button>
          </div>
        </div>
        <p className="text-xs text-charcoal/30">
          All replies are reviewed before appearing. Please keep discussion respectful and on-topic.
        </p>
      </form>
    </div>
  )
}
