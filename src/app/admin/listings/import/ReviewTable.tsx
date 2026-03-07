'use client'

import { useState } from 'react'
import { bulkInsertListings } from './actions'
import type { CleanedListing, ImportResult } from '@/types/import'

interface ReviewTableProps {
  listings: CleanedListing[]
  onBack: () => void
}

export default function ReviewTable({ listings: initialListings, onBack }: ReviewTableProps) {
  const [listings, setListings] = useState(initialListings)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const ready = listings.filter((l) => l._errors.length === 0 && !l._duplicate && !l._skip)
  const withWarnings = listings.filter((l) => l._warnings.length > 0 && l._errors.length === 0 && !l._duplicate && !l._skip)
  const withErrors = listings.filter((l) => l._errors.length > 0)
  const duplicates = listings.filter((l) => l._duplicate)
  const skipped = listings.filter((l) => l._skip)

  function toggleSkip(index: number) {
    setListings((prev) =>
      prev.map((l) =>
        l._originalIndex === index ? { ...l, _skip: !l._skip } : l
      )
    )
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await bulkInsertListings(listings)
      setResult(res)
    } catch (err) {
      setResult({
        total: listings.length,
        inserted: 0,
        skipped: 0,
        errors: [{ row: 0, name: 'Import', error: err instanceof Error ? err.message : 'Import failed' }],
      })
    } finally {
      setImporting(false)
    }
  }

  function getRowStyle(listing: CleanedListing) {
    if (listing._skip) return 'opacity-40'
    if (listing._errors.length > 0) return 'bg-red-500/5'
    if (listing._duplicate) return 'bg-white/5 opacity-60'
    if (listing._warnings.length > 0) return 'bg-accent/5'
    return ''
  }

  function getStatusBadge(listing: CleanedListing) {
    if (listing._skip) return <Badge color="gray">Skipped</Badge>
    if (listing._errors.length > 0) return <Badge color="red">Error</Badge>
    if (listing._duplicate) return <Badge color="gray">Duplicate</Badge>
    if (listing._warnings.length > 0) return <Badge color="yellow">Warning</Badge>
    return <Badge color="green">Ready</Badge>
  }

  // Import result view
  if (result) {
    return (
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center space-y-4">
          <span className={`material-symbols-outlined text-5xl ${result.errors.length === 0 ? 'text-primary' : 'text-accent'}`}>
            {result.errors.length === 0 ? 'check_circle' : 'info'}
          </span>
          <h2 className="text-white text-xl font-bold">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div>
              <p className="text-3xl font-bold text-primary">{result.inserted}</p>
              <p className="text-white/40 text-xs">Inserted</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white/40">{result.skipped}</p>
              <p className="text-white/40 text-xs">Skipped</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">{result.errors.length}</p>
              <p className="text-white/40 text-xs">Errors</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="text-left mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-lg mx-auto">
              <p className="text-red-400 text-sm font-medium mb-2">Failed rows:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-red-400/70 text-xs">
                    Row {err.row}: {err.name} — {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <a
            href="/admin/listings"
            className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors mt-4"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Listings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-white/60">
          <strong className="text-white">{ready.length}</strong> ready
        </span>
        {withWarnings.length > 0 && (
          <span className="text-accent/80">
            <strong className="text-accent">{withWarnings.length}</strong> warnings
          </span>
        )}
        {withErrors.length > 0 && (
          <span className="text-red-400/80">
            <strong className="text-red-400">{withErrors.length}</strong> errors
          </span>
        )}
        {duplicates.length > 0 && (
          <span className="text-white/40">
            <strong className="text-white/60">{duplicates.length}</strong> duplicates
          </span>
        )}
        {skipped.length > 0 && (
          <span className="text-white/40">
            <strong className="text-white/60">{skipped.length}</strong> skipped
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs font-medium uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Area</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Halal</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Cuisines</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listings.map((listing) => (
                <>
                  <tr
                    key={listing._originalIndex}
                    className={`hover:bg-white/5 transition-colors cursor-pointer ${getRowStyle(listing)}`}
                    onClick={() => setExpandedRow(
                      expandedRow === listing._originalIndex ? null : listing._originalIndex
                    )}
                  >
                    <td className="px-4 py-3 text-white/30 text-xs">{listing._originalIndex + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[200px]">{listing.name || '—'}</p>
                      <p className="text-white/30 text-xs truncate max-w-[200px]">{listing.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-white/60 text-xs capitalize">
                        {listing.area?.replace(/-/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        listing.halal_status === 'muis_certified'
                          ? 'bg-primary text-white'
                          : listing.halal_status === 'muslim_owned'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-white/10 text-white/40'
                      }`}>
                        {listing.halal_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-white/60 text-xs truncate max-w-[150px]">
                        {listing.cuisine_types?.join(', ') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(listing)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSkip(listing._originalIndex)
                        }}
                        className="text-white/40 hover:text-white text-xs transition-colors"
                        title={listing._skip ? 'Include' : 'Skip'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {listing._skip ? 'add_circle' : 'remove_circle'}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {/* Expanded detail */}
                  {expandedRow === listing._originalIndex && (
                    <tr key={`detail-${listing._originalIndex}`}>
                      <td colSpan={7} className="px-4 py-4 bg-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <Detail label="Address" value={listing.address} />
                          <Detail label="Postal Code" value={listing.postal_code} />
                          <Detail label="Phone" value={listing.phone} />
                          <Detail label="Website" value={listing.website} />
                          <Detail label="Email" value={listing.email} />
                          <Detail label="Food Type" value={listing.food_type} />
                          <Detail label="Price Range" value={listing.price_range ? '$'.repeat(listing.price_range) : null} />
                          <Detail label="Coordinates" value={
                            listing.latitude && listing.longitude
                              ? `${listing.latitude}, ${listing.longitude}`
                              : null
                          } />
                          {listing.description && (
                            <div className="col-span-full">
                              <p className="text-white/40 mb-0.5">Description</p>
                              <p className="text-white/80">{listing.description}</p>
                            </div>
                          )}
                          {listing._errors.length > 0 && (
                            <div className="col-span-full">
                              <p className="text-red-400 mb-0.5">Errors</p>
                              {listing._errors.map((e, i) => (
                                <p key={i} className="text-red-400/70">{e}</p>
                              ))}
                            </div>
                          )}
                          {listing._warnings.length > 0 && (
                            <div className="col-span-full">
                              <p className="text-accent mb-0.5">Warnings</p>
                              {listing._warnings.map((w, i) => (
                                <p key={i} className="text-accent/70">{w}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>

        <button
          onClick={handleImport}
          disabled={importing || ready.length === 0}
          className="bg-accent text-charcoal rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {importing ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
              Importing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">download</span>
              Import {ready.length} Listing{ready.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Badge({ color, children }: { color: 'green' | 'yellow' | 'red' | 'gray'; children: React.ReactNode }) {
  const styles = {
    green: 'bg-primary/20 text-primary',
    yellow: 'bg-accent/20 text-accent',
    red: 'bg-red-500/20 text-red-400',
    gray: 'bg-white/10 text-white/40',
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[color]}`}>
      {children}
    </span>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-white/40 mb-0.5">{label}</p>
      <p className="text-white/80">{value || '—'}</p>
    </div>
  )
}
