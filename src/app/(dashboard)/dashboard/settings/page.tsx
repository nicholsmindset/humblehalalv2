'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  async function handleExport() {
    setLoading('export')
    setMessage(null)
    try {
      const res = await fetch('/api/user/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `humblehalal-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Your data has been exported successfully.')
    } catch {
      setMessage('Failed to export data. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    setLoading('delete')
    setMessage(null)
    try {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Delete failed')
      setMessage('Your account has been scheduled for deletion. You will be logged out shortly.')
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
    } catch {
      setMessage('Failed to delete account. Please try again.')
    } finally {
      setLoading(null)
      setShowDeleteConfirm(false)
    }
  }

  async function handleConsentUpdate(consent: boolean) {
    setLoading('consent')
    setMessage(null)
    try {
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketing_consent: consent }),
      })
      if (!res.ok) throw new Error('Update failed')
      setMarketingConsent(consent)
      setMessage(`Marketing communications ${consent ? 'enabled' : 'disabled'}.`)
    } catch {
      setMessage('Failed to update consent. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-extrabold text-charcoal font-sans mb-8">Account Settings</h1>

      {message && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary mb-6">
          {message}
        </div>
      )}

      {/* Marketing Consent */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-charcoal mb-2">Marketing Communications</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          Receive newsletters, promotions, and updates from HumbleHalal. You can change this at any time.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleConsentUpdate(!marketingConsent)}
            disabled={loading === 'consent'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              marketingConsent ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                marketingConsent ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-charcoal/70">
            {marketingConsent ? 'Subscribed' : 'Not subscribed'}
          </span>
        </div>
      </section>

      {/* Data Export */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-charcoal mb-2">Export Your Data</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          Download a copy of all your data including profile, reviews, forum posts, and activity. PDPA compliant.
        </p>
        <button
          onClick={handleExport}
          disabled={loading === 'export'}
          className="bg-primary text-white rounded-lg font-bold px-5 py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading === 'export' ? 'Exporting...' : 'Download My Data'}
        </button>
      </section>

      {/* Delete Account */}
      <section className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
          Your reviews and forum posts will be anonymised.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-white border border-red-300 text-red-600 rounded-lg font-bold px-5 py-2.5 text-sm hover:bg-red-50 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600">
              Are you sure? This will permanently delete your account and all data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading === 'delete'}
                className="bg-red-600 text-white rounded-lg font-bold px-5 py-2.5 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading === 'delete' ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 text-charcoal rounded-lg font-medium px-5 py-2.5 text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
