'use client'

import { useState } from 'react'

interface Props {
  listingId: string
  listingName: string
  isLoggedIn: boolean
}

export function ReviewForm({ listingId, listingName, isLoggedIn }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    return (
      <div className="bg-warm-white border border-gray-200 rounded-xl p-5 text-center">
        <span className="material-symbols-outlined text-2xl text-charcoal/30 block mb-2">rate_review</span>
        <p className="text-sm text-charcoal/60 mb-3">Sign in to leave a review for {listingName}</p>
        <a
          href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
          className="inline-block bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign in to review
        </a>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-primary/20 rounded-xl p-5 text-center">
        <span className="material-symbols-outlined text-3xl text-primary block mb-2">check_circle</span>
        <p className="font-bold text-charcoal">Review submitted!</p>
        <p className="text-sm text-charcoal/60 mt-1">Thanks for helping the community.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, rating, title, body }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">rate_review</span>
        Write a Review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-sm text-charcoal/70 mb-2">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="focus:outline-none"
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                <span
                  className={`material-symbols-outlined text-3xl transition-colors ${
                    star <= (hover || rating) ? 'text-accent' : 'text-gray-200'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="review-title" className="block text-sm text-charcoal/70 mb-1">
            Title <span className="text-charcoal/40">(optional)</span>
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum it up in a line"
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="review-body" className="block text-sm text-charcoal/70 mb-1">
            Review
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="What did you think of the food, service, or atmosphere?"
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-charcoal/30 text-xs text-right mt-1">{body.length}/2000</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
