'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  'Jobs & Gigs',
  'For Sale',
  'Services',
  'Property',
  'Vehicles',
  'Education & Classes',
  'Food & Catering',
  'Matrimonial',
  'Lost & Found',
  'Community',
  'Other',
]

const AREAS = [
  'Central', 'North', 'North-East', 'East', 'West',
  'Tampines', 'Jurong East', 'Jurong West', 'Woodlands', 'Yishun',
  'Sengkang', 'Punggol', 'Bedok', 'Hougang', 'Geylang',
  'Ang Mo Kio', 'Bishan', 'Toa Payoh', 'Clementi', 'Queenstown',
  'Orchard', 'CBD', 'Sentosa', 'Online / Remote',
]

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'For Parts']

export default function ClassifiedsSubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [area, setArea] = useState('')
  const [contactMethod, setContactMethod] = useState('')
  const [contactValue, setContactValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/classifieds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        title: title.trim(),
        description: description.trim(),
        price: price ? parseFloat(price) : null,
        condition: condition || null,
        area,
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
      }),
    })

    if (res.ok) {
      router.push('/classifieds?submitted=1')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to submit. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-charcoal/50 mb-6">
        <Link href="/classifieds" className="hover:text-primary">Classifieds</Link>
        <span className="mx-2">›</span>
        <span className="text-charcoal">Post an ad</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-charcoal">Post a classified ad</h1>
        <p className="text-charcoal/60 text-sm mt-1">Free to post. Reviewed within 24 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Category <span className="text-red-400">*</span></label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary bg-white"
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Title <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Samsung Galaxy S24 Ultra — 256GB, Mint Condition"
            maxLength={120}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-charcoal/30 mt-1">{title.length}/120</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Description <span className="text-red-400">*</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your item or service in detail…"
            rows={6}
            maxLength={2000}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-primary resize-none"
          />
          <p className="text-xs text-charcoal/30 mt-1">{description.length}/2000</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-charcoal mb-1.5">Price (SGD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 text-sm">$</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0 = Free"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-bold text-charcoal mb-1.5">Condition</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary bg-white"
            >
              <option value="">Not applicable</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Area / Location <span className="text-red-400">*</span></label>
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-primary bg-white"
          >
            <option value="">Select area…</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Contact method */}
        <div>
          <label className="block text-sm font-bold text-charcoal mb-1.5">Contact method <span className="text-red-400">*</span></label>
          <div className="flex gap-2 mb-2">
            {['WhatsApp', 'Telegram', 'Email', 'Phone'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setContactMethod(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  contactMethod === m
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-charcoal/60 border-gray-200 hover:border-primary/40'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {contactMethod && (
            <input
              type={contactMethod === 'Email' ? 'email' : 'text'}
              value={contactValue}
              onChange={e => setContactValue(e.target.value)}
              placeholder={
                contactMethod === 'Email' ? 'your@email.com'
                : contactMethod === 'Phone' ? '+65 9XXX XXXX'
                : `Your ${contactMethod} number`
              }
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-primary"
            />
          )}
          {!contactMethod && (
            <input type="hidden" required value={contactValue} />
          )}
        </div>

        {/* Safety notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">Stay safe online</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Never share financial information upfront</li>
            <li>Meet buyers/sellers in safe public places</li>
            <li>Ads are reviewed before going live (up to 24h)</li>
          </ul>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !category || !title.trim() || !description.trim() || !area || !contactMethod || !contactValue.trim()}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Submitting…</>
              : <><span className="material-symbols-outlined text-sm">publish</span>Submit ad</>
            }
          </button>
          <Link href="/classifieds" className="text-sm text-charcoal/50 hover:text-charcoal transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
