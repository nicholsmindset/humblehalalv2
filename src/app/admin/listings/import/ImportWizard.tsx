'use client'

import { useState } from 'react'
import FileUploader from './FileUploader'
import ColumnMapper from './ColumnMapper'
import AICleaner from './AICleaner'
import ReviewTable from './ReviewTable'
import type { RawRow, CleanedListing } from '@/types/import'

type Step = 1 | 2 | 3

const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Map & Clean' },
  { num: 3, label: 'Review & Import' },
]

export default function ImportWizard() {
  const [step, setStep] = useState<Step>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<RawRow[]>([])
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [vertical, setVertical] = useState('food')
  const [cleanedRows, setCleanedRows] = useState<CleanedListing[]>([])
  const [subStep, setSubStep] = useState<'map' | 'clean'>('map')

  function handleFileParsed(h: string[], r: RawRow[], name: string) {
    setHeaders(h)
    setRows(r)
    setFileName(name)
  }

  function handleMappingConfirmed(m: Record<string, string>, v: string) {
    setMapping(m)
    setVertical(v)
    setSubStep('clean')
  }

  function handleCleaningComplete(cleaned: CleanedListing[]) {
    setCleanedRows(cleaned)
    setStep(3)
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s.num
                    ? 'bg-primary text-white'
                    : step > s.num
                      ? 'bg-primary/20 text-primary'
                      : 'bg-white/10 text-white/30'
                }`}
              >
                {step > s.num ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  s.num
                )}
              </div>
              <span className={`text-sm hidden sm:inline ${
                step === s.num ? 'text-white font-medium' : 'text-white/40'
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 md:w-20 h-px mx-3 ${
                step > s.num ? 'bg-primary/40' : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* File info bar */}
      {fileName && step > 1 && (
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span className="material-symbols-outlined text-sm">description</span>
          <span>{fileName}</span>
          <span className="text-white/20">·</span>
          <span>{rows.length.toLocaleString()} rows</span>
        </div>
      )}

      {/* Step content */}
      {step === 1 && (
        <div className="space-y-6">
          <FileUploader onParsed={handleFileParsed} />
          {rows.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => { setStep(2); setSubStep('map') }}
                className="bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Next: Map Columns
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && subStep === 'map' && (
        <ColumnMapper
          headers={headers}
          onConfirm={handleMappingConfirmed}
          onBack={() => setStep(1)}
        />
      )}

      {step === 2 && subStep === 'clean' && (
        <AICleaner
          rows={rows}
          mapping={mapping}
          vertical={vertical}
          onComplete={handleCleaningComplete}
          onBack={() => setSubStep('map')}
        />
      )}

      {step === 3 && (
        <ReviewTable
          listings={cleanedRows}
          onBack={() => { setStep(2); setSubStep('map') }}
        />
      )}
    </div>
  )
}
