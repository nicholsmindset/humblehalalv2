'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  listingId: string
  listingName: string
  onSuccess?: () => void
}

export function ReviewForm({ listingId, listingName, onSuccess }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (body.trim().length < 20) { setError('Review must be at least 20 characters.'); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, rating, body: body.trim() }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to submit review. Please try again.')
      return
    }

    setRating(0)
    setBody('')
    onSuccess?.()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-bold text-charcoal">Write a Review for {listingName}</h3>

      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Your Rating <span className="text-red-500">*</span></label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              className="text-3xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <span className={(hovered || rating) >= star ? 'text-accent' : 'text-gray-300'}>★</span>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-charcoal/60 self-center">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Review body */}
      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-charcoal mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience — food quality, service, ambience, halal compliance..."
          rows={4}
          maxLength={2000}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        <p className="text-xs text-charcoal/40 mt-1 text-right">{body.length}/2000</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>

      <p className="text-xs text-charcoal/40 text-center">
        Reviews are moderated before publication. Be honest, be helpful.
      </p>
    </form>
  )
}
