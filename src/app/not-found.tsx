'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', display: 'flex', flexDirection: 'column' }}>

      {/* Minimal nav */}
      <header style={{ backgroundColor: '#f5f0eb', borderBottom: '1px solid #e0d5cc', padding: '0 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎂</span>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '20px', color: '#2d1a0e', letterSpacing: '0.3px' }}>
              Whiskly
            </span>
          </Link>
          <Link
            href="/bakers"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              color: '#5c3d2e',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Browse Bakers
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>

          {/* Decorative divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ height: '1px', width: '48px', backgroundColor: '#e0d5cc' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#9c7b6b', letterSpacing: '2px', textTransform: 'uppercase' }}>
              404
            </span>
            <div style={{ height: '1px', width: '48px', backgroundColor: '#e0d5cc' }} />
          </div>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: 700,
            color: '#2d1a0e',
            margin: '0 0 16px',
            lineHeight: 1.3,
          }}>
            This page doesn't exist
          </h1>

          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#5c3d2e',
            lineHeight: 1.7,
            margin: '0 0 40px',
          }}>
            The link may have moved or the page was never here to begin with.
            Let's get you back to something good.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/bakers"
              style={{
                display: 'inline-block',
                backgroundColor: '#2d1a0e',
                color: '#ffffff',
                padding: '13px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Georgia, serif',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Browse Bakers
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                backgroundColor: 'transparent',
                color: '#2d1a0e',
                padding: '13px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Georgia, serif',
                fontWeight: 600,
                fontSize: '14px',
                border: '1px solid #2d1a0e',
              }}
            >
              Go Home
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e0d5cc', padding: '20px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#9c7b6b', margin: 0 }}>
          Whiskly · The custom baked goods marketplace
        </p>
      </footer>

    </div>
  )
}
