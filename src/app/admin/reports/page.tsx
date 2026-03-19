import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReportGenerator from './ReportGenerator'

export const metadata: Metadata = {
  title: 'Sponsor Reports | HumbleHalal Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // Load all active/featured listings for the selector
  const { data: listings } = await (supabase as any)
    .from('listings')
    .select('id, name, area, vertical, halal_status')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(500)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Sponsor Reports</h1>
        <p className="text-white/50 text-sm mt-1">
          Generate branded PDF analytics reports to send to sponsors and featured listings.
        </p>
      </div>

      <ReportGenerator listings={listings ?? []} />
    </div>
  )
}
