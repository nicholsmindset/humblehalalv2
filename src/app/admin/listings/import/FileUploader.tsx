'use client'

import { useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import { parseXlsxFile } from './actions'
import type { RawRow } from '@/types/import'

interface FileUploaderProps {
  onParsed: (headers: string[], rows: RawRow[], fileName: string) => void
}

export default function FileUploader({ onParsed }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: RawRow[]; fileName: string; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setParsing(true)
    setPreview(null)

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      setParsing(false)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()

    try {
      if (ext === 'csv') {
        // Parse CSV client-side with PapaParse
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            if (result.errors.length > 0 && result.data.length === 0) {
              setError(`CSV parse error: ${result.errors[0].message}`)
              setParsing(false)
              return
            }
            const headers = result.meta.fields || []
            const rows = result.data as RawRow[]
            setPreview({ headers, rows: rows.slice(0, 10), fileName: file.name, total: rows.length })
            onParsed(headers, rows, file.name)
            setParsing(false)
          },
          error: (err) => {
            setError(`CSV parse error: ${err.message}`)
            setParsing(false)
          },
        })
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Parse XLSX server-side
        const formData = new FormData()
        formData.append('file', file)
        const { headers, rows } = await parseXlsxFile(formData)
        if (rows.length === 0) {
          setError('No data found in the spreadsheet.')
          setParsing(false)
          return
        }
        setPreview({ headers, rows: rows.slice(0, 10), fileName: file.name, total: rows.length })
        onParsed(headers, rows, file.name)
        setParsing(false)
      } else {
        setError('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.')
        setParsing(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
      setParsing(false)
    }
  }, [onParsed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/10'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <span className="material-symbols-outlined text-4xl text-white/40 mb-3 block">
          upload_file
        </span>
        {parsing ? (
          <div className="space-y-2">
            <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
            <p className="text-white/60 text-sm">Parsing file...</p>
          </div>
        ) : (
          <>
            <p className="text-white font-medium">
              Drop your Outscraper export here
            </p>
            <p className="text-white/40 text-sm mt-1">
              CSV, XLSX, or XLS (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-sm">error</span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <p className="text-white text-sm font-medium">{preview.fileName}</p>
            </div>
            <p className="text-white/40 text-sm">
              {preview.total.toLocaleString()} rows detected
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {preview.headers.slice(0, 8).map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-white/40 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    {preview.headers.length > 8 && (
                      <th className="text-left px-3 py-2 text-white/40 font-medium">
                        +{preview.headers.length - 8} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      {preview.headers.slice(0, 8).map((h) => (
                        <td key={h} className="px-3 py-2 text-white/60 truncate max-w-[200px]">
                          {row[h] || '—'}
                        </td>
                      ))}
                      {preview.headers.length > 8 && (
                        <td className="px-3 py-2 text-white/30">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.total > 10 && (
              <div className="border-t border-white/10 px-3 py-2 text-white/30 text-xs text-center">
                Showing first 10 of {preview.total.toLocaleString()} rows
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
