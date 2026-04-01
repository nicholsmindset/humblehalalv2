'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ModerationActions({
  id,
  contentType,
}: {
  id: string
  contentType: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content_type: contentType, action }),
      })
      if (res.ok) {
        setDone(action === 'approve' ? 'approved' : 'rejected')
        setTimeout(() => router.refresh(), 800)
      }
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
        done === 'approved' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'
      }`}>
        {done}
      </span>
    )
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => act('approve')}
        disabled={!!loading}
        className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-primary/30 transition-colors disabled:opacity-50"
      >
        <span className={`material-symbols-outlined text-xs ${loading === 'approve' ? 'animate-spin' : ''}`}>
          {loading === 'approve' ? 'refresh' : 'check'}
        </span>
        Approve
      </button>
      <button
        onClick={() => act('reject')}
        disabled={!!loading}
        className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        <span className={`material-symbols-outlined text-xs ${loading === 'reject' ? 'animate-spin' : ''}`}>
          {loading === 'reject' ? 'refresh' : 'close'}
        </span>
        Reject
      </button>
    </div>
  )
}
