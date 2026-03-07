import type { Metadata } from 'next'
import ImportWizard from './ImportWizard'

export const metadata: Metadata = {
  title: 'Import Listings | HumbleHalal Admin',
}

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Import Listings</h1>
        <p className="text-white/40 text-sm mt-1">
          Upload an Outscraper CSV/XLSX export to bulk-import listings with AI-powered data cleaning.
        </p>
      </div>

      <ImportWizard />
    </div>
  )
}
