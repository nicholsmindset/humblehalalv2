import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: evt } = (await (supabase as any)
    .from('events')
    .select('title, area, starts_at, price_type, venue, organiser')
    .eq('slug', slug)
    .single()) as any

  const title = evt?.title ?? 'Halal Event'
  const area = evt?.area?.replace(/-/g, ' ') ?? 'Singapore'
  const isFree = evt?.price_type === 'free'
  const venue = evt?.venue ?? null

  const dateStr = evt?.starts_at
    ? new Date(evt.starts_at).toLocaleDateString('en-SG', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f231d 0%, #1a3a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Logo + Event label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: '#047857',
                borderRadius: '12px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ color: 'white', fontSize: '24px' }}>🕌</div>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 800 }}>Humble</span>
              <span style={{ color: '#D4A017', fontSize: '28px', fontStyle: 'italic' }}>Halal</span>
            </div>
          </div>
          <div
            style={{
              background: '#D4A017',
              color: '#1C1917',
              fontSize: '18px',
              fontWeight: 700,
              padding: '8px 20px',
              borderRadius: '999px',
            }}
          >
            {isFree ? '🎉 FREE EVENT' : '🎟 EVENT'}
          </div>
        </div>

        {/* Middle: Event title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'white', fontSize: '52px', fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: '24px', color: 'rgba(255,255,255,0.6)', fontSize: '24px' }}>
            {dateStr && <span>📅 {dateStr}</span>}
            {venue && <span>📍 {venue}</span>}
          </div>
        </div>

        {/* Bottom: Area + site */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              textTransform: 'capitalize',
            }}
          >
            {area}, Singapore
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }}>
            humblehalal.sg
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
