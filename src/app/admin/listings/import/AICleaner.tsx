'use client'

import { useState, useEffect } from 'react'
import { cleanWithAI, checkDuplicates } from './actions'
import type { RawRow, CleanedListing } from '@/types/import'

interface AICleanerProps {
  rows: RawRow[]
  mapping: Record<string, string>
  vertical: string
  onComplete: (cleaned: CleanedListing[]) => void
  onBack: () => void
}

export default function AICleaner({ rows, mapping, vertical, onComplete, onBack }: AICleanerProps) {
  const [status, setStatus] = useState<'idle' | 'cleaning' | 'duplicates' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ total: number; ready: number; warnings: number; errors: number } | null>(null)

  useEffect(() => {
    startCleaning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCleaning() {
    setStatus('cleaning')
    setProgress(10)

    try {
      // Step 1: AI cleaning
      setProgress(20)
      const cleaned = await cleanWithAI(rows, mapping, vertical)
      setProgress(70)

      // Step 2: Duplicate detection
      setStatus('duplicates')
      setProgress(80)
      const withDuplicates = await checkDuplicates(cleaned)
      setProgress(100)

      // Calculate stats
      const ready = withDuplicates.filter((r) => r._errors.length === 0 && !r._duplicate).length
      const warnings = withDuplicates.filter((r) => r._warnings.length > 0 && r._errors.length === 0).length
      const errors = withDuplicates.filter((r) => r._errors.length > 0).length

      setStats({ total: withDuplicates.length, ready, warnings, errors })
      setStatus('done')
      onComplete(withDuplicates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI cleaning failed')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">
                {status === 'cleaning' && 'Cleaning data with AI...'}
                {status === 'duplicates' && 'Checking for duplicates...'}
                {status === 'done' && 'Processing complete'}
                {status === 'error' && 'Processing failed'}
                {status === 'idle' && 'Starting...'}
              </span>
              <span className="text-white/40">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'error' ? 'bg-red-500' : status === 'done' ? 'bg-primary' : 'bg-primary/70'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Processing steps */}
          <div className="space-y-3">
            <Step
              label="Area detection & postal code mapping"
              done={progress >= 30}
              active={status === 'cleaning' && progress < 30}
            />
            <Step
              label="Cuisine type normalization"
              done={progress >= 50}
              active={status === 'cleaning' && progress >= 30 && progress < 50}
            />
            <Step
              label="Halal status & food type detection"
              done={progress >= 60}
              active={status === 'cleaning' && progress >= 50 && progress < 60}
            />
            <Step
              label="Description generation for missing entries"
              done={progress >= 70}
              active={status === 'cleaning' && progress >= 60 && progress < 70}
            />
            <Step
              label="Duplicate detection"
              done={progress >= 100}
              active={status === 'duplicates'}
            />
          </div>

          {/* Stats summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.ready}</p>
                <p className="text-white/40 text-xs">Ready</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{stats.warnings}</p>
                <p className="text-white/40 text-xs">Warnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
                <p className="text-white/40 text-xs">Errors</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={startCleaning}
                className="mt-2 text-red-400 text-sm underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Back button (only before processing starts or on error) */}
      {(status === 'error') && (
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to mapping
          </button>
        </div>
      )}
    </div>
  )
}

function Step({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
      ) : active ? (
        <span className="material-symbols-outlined text-primary text-sm animate-spin">refresh</span>
      ) : (
        <span className="material-symbols-outlined text-white/20 text-sm">radio_button_unchecked</span>
      )}
      <span className={`text-sm ${done ? 'text-white/60' : active ? 'text-white' : 'text-white/30'}`}>
        {label}
      </span>
    </div>
  )
}
