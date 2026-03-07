'use client'

import { useState, useEffect } from 'react'
import { MAPPABLE_FIELDS, OUTSCRAPER_AUTO_MAP } from '@/types/import'

// DB vertical_type enum values (different from TS Vertical enum)
const DB_VERTICALS = [
  { value: 'food', label: 'Food' },
  { value: 'business', label: 'Business' },
  { value: 'catering', label: 'Catering' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'mosque', label: 'Mosque' },
  { value: 'product', label: 'Product' },
  { value: 'prayer_room', label: 'Prayer Room' },
]

interface ColumnMapperProps {
  headers: string[]
  onConfirm: (mapping: Record<string, string>, vertical: string) => void
  onBack: () => void
}

export default function ColumnMapper({ headers, onConfirm, onBack }: ColumnMapperProps) {
  const [vertical, setVertical] = useState('food')
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Auto-map on mount
  useEffect(() => {
    const autoMap: Record<string, string> = {}
    const usedTargets = new Set<string>()

    for (const header of headers) {
      const normalized = header.toLowerCase().replace(/[\s-]/g, '_')
      const target = OUTSCRAPER_AUTO_MAP[normalized]
      if (target && !usedTargets.has(target)) {
        autoMap[header] = target
        usedTargets.add(target)
      }
    }

    setMapping(autoMap)
  }, [headers])

  const handleMappingChange = (header: string, target: string) => {
    setMapping((prev) => {
      const next = { ...prev }
      if (target === '') {
        delete next[header]
      } else {
        // Remove any other header mapped to this target
        for (const [key, val] of Object.entries(next)) {
          if (val === target && key !== header) delete next[key]
        }
        next[header] = target
      }
      return next
    })
  }

  const hasNameMapping = Object.values(mapping).includes('name')
  const usedTargets = new Set(Object.values(mapping))

  return (
    <div className="space-y-6">
      {/* Vertical selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <label className="block text-white text-sm font-medium mb-2">
          Import vertical
        </label>
        <p className="text-white/40 text-xs mb-3">
          All rows in this import will be assigned to this vertical.
        </p>
        <div className="flex flex-wrap gap-2">
          {DB_VERTICALS.map((v) => (
            <button
              key={v.value}
              onClick={() => setVertical(v.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                vertical === v.value
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column mapping */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white text-sm font-medium">Column Mapping</h3>
          <p className="text-white/40 text-xs">
            {Object.keys(mapping).length} of {headers.length} columns mapped
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {headers.map((header) => {
            const currentTarget = mapping[header] || ''
            const isAutoMapped = OUTSCRAPER_AUTO_MAP[header.toLowerCase().replace(/[\s-]/g, '_')] === currentTarget && currentTarget !== ''

            return (
              <div key={header} className="flex items-center gap-4 px-5 py-3">
                {/* Source column */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{header}</p>
                  {isAutoMapped && (
                    <p className="text-primary/60 text-[10px] mt-0.5">auto-detected</p>
                  )}
                </div>

                {/* Arrow */}
                <span className="material-symbols-outlined text-white/20 text-sm shrink-0">
                  arrow_forward
                </span>

                {/* Target field dropdown */}
                <div className="flex-1">
                  <select
                    value={currentTarget}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" className="bg-charcoal text-white/40">
                      Skip
                    </option>
                    {MAPPABLE_FIELDS.map((field) => (
                      <option
                        key={field.value}
                        value={field.value}
                        disabled={usedTargets.has(field.value) && mapping[header] !== field.value}
                        className="bg-charcoal"
                      >
                        {field.label}{'required' in field && field.required ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation message */}
      {!hasNameMapping && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-sm">warning</span>
          <p className="text-accent text-sm">
            The &ldquo;Name&rdquo; field is required. Please map a column to it.
          </p>
        </div>
      )}

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
          onClick={() => onConfirm(mapping, vertical)}
          disabled={!hasNameMapping}
          className="bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Clean with AI
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
        </button>
      </div>
    </div>
  )
}
