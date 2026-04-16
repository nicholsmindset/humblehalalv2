import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const HALAL_BADGE: Record<string, { label: string; color: string }> = {
  muis_certified: { label: 'MUIS Certified', color: '#047857' },
  muslim_owned:   { label: 'Muslim Owned',   color: '#065f46' },
  self_declared:  { label: 'Halal (Self-Declared)', color: '#6b7280' },
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: listing } = (await (supabase as any)
    .from('listings')
    .select('name, area, halal_status, avg_rating, review_count')
    .eq('slug', slug)
    .single()) as any

  const name = listing?.name ?? 'Halal Restaurant'
  const area = listing?.area?.replace(/-/g, ' ') ?? 'Singapore'
  const badge = HALAL_BADGE[listing?.halal_status]
  const rating = listing?.avg_rating ? Number(listing.avg_rating).toFixed(1) : null
  const reviewCount = listing?.review_count ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f231d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Logo */}
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
          <div style={{ display: 'flex', gap: '0' }}>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 800 }}>Humble</span>
            <span style={{ color: '#D4A017', fontSize: '28px', fontStyle: 'italic' }}>Halal</span>
          </div>
        </div>

        {/* Middle: Listing name + area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'white', fontSize: '56px', fontWeight: 800, lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 {area.charAt(0).toUpperCase() + area.slice(1)}, Singapore
          </div>
        </div>

        {/* Bottom: Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {badge && (
            <div
              style={{
                background: badge.color,
                color: 'white',
                fontSize: '20px',
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: '999px',
              }}
            >
              ✓ {badge.label}
            </div>
          )}
          {rating && (
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '20px',
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              ⭐ {rating} ({reviewCount} reviews)
            </div>
          )}
          <div
            style={{
              marginLeft: 'auto',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '18px',
            }}
          >
            humblehalal.sg
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
