import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Events | HumbleHalal',
  robots: { index: false },
}

export default async function MyEventsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/my-events')

  const { data: events } = (await db
    .from('events')
    .select('id, slug, title, starts_at, ends_at, status, is_ticketed, total_tickets_sold, total_revenue, area, venue, is_online')
    .eq('created_by', user.id)
    .order('starts_at', { ascending: false })) as any

  const now = new Date()

  const STATUS_LABEL: Record<string, string> = {
    published: 'Published',
    pending: 'Under Review',
    draft: 'Draft',
    archived: 'Archived',
  }

  const STATUS_COLOR: Record<string, string> = {
    published: 'bg-primary/10 text-primary',
    pending: 'bg-amber-50 text-amber-700',
    draft: 'bg-gray-100 text-charcoal/50',
    archived: 'bg-gray-100 text-charcoal/30',
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-xs text-charcoal/40 hover:text-primary mb-1 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-charcoal mt-1">My Events</h1>
          </div>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Event
          </Link>
        </div>

        {/* Events list */}
        {!events || events.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-charcoal/20 block mb-3">event</span>
            <p className="font-medium text-charcoal/60">No events yet</p>
            <p className="text-sm text-charcoal/40 mt-1">Create your first event to start selling tickets.</p>
            <Link
              href="/events/create"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt: any) => {
              const startDate = new Date(evt.starts_at)
              const isPast = new Date(evt.ends_at ?? evt.starts_at) < now
              const status = evt.status ?? 'draft'

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[status] ?? STATUS_COLOR.draft}`}>
                            {STATUS_LABEL[status] ?? status}
                          </span>
                          {isPast && (
                            <span className="text-xs bg-gray-100 text-charcoal/40 px-2.5 py-0.5 rounded-full">Past</span>
                          )}
                          {evt.is_ticketed && (
                            <span className="text-xs bg-primary/5 text-primary px-2.5 py-0.5 rounded-full">Ticketed</span>
                          )}
                        </div>
                        <h2 className="font-bold text-charcoal text-base leading-snug truncate">{evt.title}</h2>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-charcoal/50">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {startDate.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {evt.venue && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {evt.venue}
                            </span>
                          )}
                          {evt.is_online && !evt.venue && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">videocam</span>
                              Online
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      {evt.is_ticketed && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-extrabold text-charcoal">
                            {evt.total_tickets_sold ?? 0}
                          </p>
                          <p className="text-xs text-charcoal/40">tickets sold</p>
                          {(evt.total_revenue ?? 0) > 0 && (
                            <>
                              <p className="text-sm font-bold text-primary mt-1">
                                SGD {((evt.total_revenue ?? 0) / 100).toFixed(2)}
                              </p>
                              <p className="text-xs text-charcoal/40">revenue</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                      <Link
                        href={`/events/${evt.slug}`}
                        className="text-xs text-charcoal/50 hover:text-primary transition-colors flex items-center gap-1"
                        target="_blank"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        View page
                      </Link>
                      {evt.is_ticketed && status === 'published' && (
                        <Link
                          href={`/dashboard/my-events/${evt.id}/attendees`}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">people</span>
                          Attendees & Check-in
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
