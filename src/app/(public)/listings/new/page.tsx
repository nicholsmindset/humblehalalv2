import type { Metadata } from 'next'
import { NewListingForm } from './NewListingForm'

export const metadata: Metadata = {
  title: 'Add Your Halal Business — List for Free | HumbleHalal',
  description: "Add your halal restaurant, catering company, Muslim-owned business, or halal product to Singapore's largest halal directory. Free basic listing.",
  alternates: { canonical: '/listings/new' },
}

export default function NewListingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="material-symbols-outlined text-5xl text-primary block mb-4">add_business</span>
        <h1 className="text-3xl font-extrabold text-charcoal font-sans mb-2">
          List Your Halal Business
        </h1>
        <p className="text-charcoal/60 max-w-md mx-auto">
          Free listing on Singapore&apos;s #1 halal directory. Reach thousands of Muslim consumers every month.
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex justify-center gap-6 mb-10 text-sm text-charcoal/50">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          Free basic listing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          Live within 24h
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          10,000+ monthly visitors
        </span>
      </div>

      <NewListingForm />
    </div>
  )
}
