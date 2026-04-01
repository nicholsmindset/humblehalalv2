'use client'

interface CsvExportButtonProps {
  data: Record<string, string | number>[]
  filename: string
  label?: string
}

export function CsvExportButton({ data, filename, label = 'Export CSV' }: CsvExportButtonProps) {
  function handleExport() {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/20 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-sm">download</span>
      {label}
    </button>
  )
}
