import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = "HumbleHalal — Singapore's Halal Ecosystem"

export default function Image() {
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
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: '#047857',
              borderRadius: '14px',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
            }}
          >
            🕌
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>Humble</span>
            <span style={{ color: '#D4A017', fontSize: '36px', fontStyle: 'italic' }}>Halal</span>
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              color: 'white',
              fontSize: '68px',
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            <span>Singapore’s all-in-one&nbsp;</span>
            <span style={{ color: '#D4A017', fontStyle: 'italic' }}>halal&nbsp;</span>
            <span>ecosystem.</span>
          </div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.7)', fontSize: '28px', fontWeight: 500 }}>
            Restaurants · Businesses · Events · Mosques · Travel
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              background: '#D4A017',
              color: '#1C1917',
              fontSize: '20px',
              fontWeight: 700,
              padding: '10px 24px',
              borderRadius: '999px',
            }}
          >
            MUIS-aware · Community-verified
          </div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.5)', fontSize: '22px', fontWeight: 600 }}>
            humblehalal.sg
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
