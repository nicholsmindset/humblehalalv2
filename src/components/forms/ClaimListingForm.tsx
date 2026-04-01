'use client'

import { useState } from 'react'

interface ClaimListingFormProps {
  listingId: string
  listingName: string
  onSuccess?: () => void
}

export function ClaimListingForm({ listingId, listingName, onSuccess }: ClaimListingFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/listings/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        claimant_name: name.trim(),
        claimant_role: role,
        claimant_email: email.trim(),
        claimant_phone: phone.trim(),
        message: message.trim(),
      }),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      onSuccess?.()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to submit claim. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-primary text-4xl block mb-2">verified</span>
        <h3 className="font-bold text-charcoal mb-1">Claim Submitted</h3>
        <p className="text-charcoal/60 text-sm">We&apos;ll verify your ownership and get back to you within 2–3 business days.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-2 text-sm text-amber-800">
        <span className="material-symbols-outlined text-amber-600 text-sm shrink-0 mt-0.5">info</span>
        <span>Claiming <strong>{listingName}</strong>. We&apos;ll verify your ownership before granting access.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="claim-name" className="block text-sm font-medium text-charcoal mb-1">Your Name <span className="text-red-500">*</span></label>
          <input
            id="claim-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            maxLength={100}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="claim-role" className="block text-sm font-medium text-charcoal mb-1">Your Role <span className="text-red-500">*</span></label>
          <select
            id="claim-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Select role...</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="marketing">Marketing Representative</option>
            <option value="authorized_agent">Authorized Agent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="claim-email" className="block text-sm font-medium text-charcoal mb-1">Business Email <span className="text-red-500">*</span></label>
          <input
            id="claim-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="claim-phone" className="block text-sm font-medium text-charcoal mb-1">Contact Number <span className="text-red-500">*</span></label>
          <input
            id="claim-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+65 9xxx xxxx"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="claim-message" className="block text-sm font-medium text-charcoal mb-1">Additional Information</label>
        <textarea
          id="claim-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any details to help us verify your ownership (e.g. UEN number, website, social media)"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
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
        {loading ? 'Submitting...' : 'Submit Claim Request'}
      </button>
    </form>
  )
}
