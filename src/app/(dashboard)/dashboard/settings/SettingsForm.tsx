'use client'

import React from 'react'

interface Props {
  userId: string
  email: string
  initialProfile: {
    display_name?: string
    phone?: string
    email_notifications_reviews?: boolean
    email_notifications_events?: boolean
  }
}

export function SettingsForm({ userId, email, initialProfile }: Props) {
  const [displayName, setDisplayName] = React.useState(initialProfile.display_name ?? '')
  const [phone, setPhone] = React.useState(initialProfile.phone ?? '')
  const [emailReviews, setEmailReviews] = React.useState(initialProfile.email_notifications_reviews ?? true)
  const [emailEvents, setEmailEvents] = React.useState(initialProfile.email_notifications_events ?? true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          phone: phone.trim() || null,
          email_notifications_reviews: emailReviews,
          email_notifications_events: emailEvents,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-charcoal mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-charcoal/60 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-charcoal/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-charcoal/60 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-charcoal"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-charcoal/60 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+65 9123 4567"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm text-charcoal"
            />
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-charcoal mb-4">Email Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailReviews}
              onChange={(e) => setEmailReviews(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-charcoal">Notify me when someone reviews my listing</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEvents}
              onChange={(e) => setEmailEvents(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-charcoal">Send me event reminders</span>
          </label>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </form>
  )
}
