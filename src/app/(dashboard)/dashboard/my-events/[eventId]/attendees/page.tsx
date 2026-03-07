'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Attendee {
  id: string
  attendee_name: string
  attendee_email: string
  qr_code: string
  checked_in: boolean
  checked_in_at: string | null
  status: string
  ticket_name: string
  order_number: string
}

export default function AttendeesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all')
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  const fetchAttendees = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/attendees`)
    if (!res.ok) return
    const data = await res.json()
    setAttendees(data.attendees ?? [])
    setEventTitle(data.event_title ?? '')
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  const handleCheckIn = async (itemId: string, currentState: boolean) => {
    setCheckingIn(itemId)
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, checked_in: !currentState }),
      })
      if (res.ok) {
        setAttendees(prev =>
          prev.map(a =>
            a.id === itemId
              ? { ...a, checked_in: !currentState, checked_in_at: !currentState ? new Date().toISOString() : null }
              : a
          )
        )
      }
    } finally {
      setCheckingIn(null)
    }
  }

  const filtered = attendees.filter(a => {
    const matchSearch =
      !search ||
      a.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
      a.attendee_email.toLowerCase().includes(search.toLowerCase()) ||
      a.qr_code.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'checked_in' && a.checked_in) ||
      (filter === 'not_checked_in' && !a.checked_in)
    return matchSearch && matchFilter
  })

  const checkedInCount = attendees.filter(a => a.checked_in).length

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/my-events" className="text-xs text-charcoal/40 hover:text-primary inline-flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            My Events
          </Link>
          <h1 className="text-xl font-extrabold text-charcoal">Attendees & Check-in</h1>
          {eventTitle && <p className="text-charcoal/60 text-sm mt-0.5">{eventTitle}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-charcoal">{attendees.length}</p>
            <p className="text-xs text-charcoal/50 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{checkedInCount}</p>
            <p className="text-xs text-charcoal/50 mt-0.5">Checked In</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{attendees.length - checkedInCount}</p>
            <p className="text-xs text-charcoal/50 mt-0.5">Remaining</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 text-base">search</span>
            <input
              type="text"
              placeholder="Search by name, email, or QR code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-charcoal"
          >
            <option value="all">All</option>
            <option value="checked_in">Checked in</option>
            <option value="not_checked_in">Not checked in</option>
          </select>
        </div>

        {/* Attendees list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-charcoal/40 text-sm">No attendees found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <div
                key={a.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${
                  a.checked_in ? 'border-primary/20 bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${a.checked_in ? 'bg-primary' : 'bg-gray-300'}`}
                    />
                    <p className="font-medium text-charcoal text-sm truncate">{a.attendee_name}</p>
                  </div>
                  <p className="text-xs text-charcoal/40 truncate mt-0.5 ml-4">{a.attendee_email}</p>
                  <div className="flex items-center gap-3 mt-1 ml-4">
                    <span className="text-xs text-charcoal/30">{a.ticket_name}</span>
                    {a.checked_in && a.checked_in_at && (
                      <span className="text-xs text-primary">
                        ✓ {new Date(a.checked_in_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCheckIn(a.id, a.checked_in)}
                  disabled={checkingIn === a.id}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    a.checked_in
                      ? 'bg-gray-100 text-charcoal/50 hover:bg-red-50 hover:text-red-600'
                      : 'bg-primary text-white hover:bg-primary/90'
                  } disabled:opacity-50`}
                >
                  {checkingIn === a.id
                    ? '…'
                    : a.checked_in
                    ? 'Undo'
                    : 'Check in'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
