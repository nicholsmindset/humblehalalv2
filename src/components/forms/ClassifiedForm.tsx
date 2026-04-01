'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CLASSIFIED_CATEGORIES = [
  'Jobs', 'Housing', 'For Sale', 'Vehicles', 'Services',
  'Electronics', 'Furniture', 'Fashion', 'Food & Beverages',
  'Lessons & Tuition', 'Community', 'Other',
] as const

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts'] as const

interface ClassifiedFormProps {
  onSuccess?: (slug: string) => void
}

export function ClassifiedForm({ onSuccess }: ClassifiedFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [price, setPrice] = useState('')
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false)
  const [description, setDescription] = useState('')
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [contactValue, setContactValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !category || !description.trim() || !contactValue.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/classifieds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        category,
        condition: condition || null,
        price: price ? Number(price) : null,
        is_negotiable: isPriceNegotiable,
        description: description.trim(),
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to post classified. Please try again.')
      return
    }

    const data = await res.json()
    onSuccess?.(data.slug)
    router.push(`/classifieds/${data.slug}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="classified-title" className="block text-sm font-medium text-charcoal mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="classified-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. iPhone 15 Pro — Excellent Condition"
          required
          maxLength={120}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Category + Condition row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="classified-category" className="block text-sm font-medium text-charcoal mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="classified-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Select category...</option>
            {CLASSIFIED_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="classified-condition" className="block text-sm font-medium text-charcoal mb-1">Condition</label>
          <select
            id="classified-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">N/A</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price */}
      <div>
        <label htmlFor="classified-price" className="block text-sm font-medium text-charcoal mb-1">Price (SGD)</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 text-sm">$</span>
            <input
              id="classified-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-7 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPriceNegotiable}
              onChange={(e) => setIsPriceNegotiable(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-charcoal">Negotiable</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="classified-description" className="block text-sm font-medium text-charcoal mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="classified-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item, service, or opportunity in detail..."
          rows={5}
          required
          minLength={30}
          maxLength={3000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        <p className="text-xs text-charcoal/40 mt-1 text-right">{description.length}/3000</p>
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Contact Method <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          {['whatsapp', 'telegram', 'email'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setContactMethod(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                contactMethod === m
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-charcoal border-gray-200 hover:border-primary'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <input
          type={contactMethod === 'email' ? 'email' : 'tel'}
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          placeholder={contactMethod === 'email' ? 'your@email.com' : '+65 9xxx xxxx'}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Posting...' : 'Post Classified'}
      </button>

      <p className="text-xs text-charcoal/40 text-center">
        All classifieds are reviewed before publication. No haram products or services.
      </p>
    </form>
  )
}
