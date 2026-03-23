'use client'

// WhisklyLogo — placeholder using whisk icon direction from designer brief
// Font: DM Serif Display loaded via Google Fonts in this component
// Replace with final custom letterforms once designer delivers assets

import { useEffect } from 'react'

type LogoVariant = 'light' | 'dark' | 'horizontal'

interface WhisklyLogoProps {
  variant?: LogoVariant
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

const sizes = {
  sm: { icon: 28, wordmark: 22, tagline: 8 },
  md: { icon: 40, wordmark: 30, tagline: 9 },
  lg: { icon: 56, wordmark: 42, tagline: 10 },
}

// Whisk SVG — extracted from designer logo direction brief
// Light variant: espresso strokes + clay crown accent
function WhiskIcon({ size, dark }: { size: number; dark?: boolean }) {
  const stroke = dark ? '#f5f0eb' : '#2d1a0e'
  const accent = dark ? '#c8906a' : '#8B4513'
  const h = Math.round(size * 1.115)

  return (
    <svg width={size} height={h} viewBox="0 0 52 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <line x1="26" y1="57" x2="26" y2="32" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      {/* Wrap loop */}
      <ellipse cx="26" cy="32.5" rx="4.5" ry="3" stroke={stroke} strokeWidth="1.6" fill="none" />
      {/* Wires */}
      <path d="M26 32 C16 29 10 20 14 11" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M26 32 C19 27 19 17 22 11" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M26 32 C33 27 33 17 30 11" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M26 32 C36 29 42 20 38 11" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      {/* Crown arc — clay accent */}
      <path d="M14 11 C18 5 22 7 26 6 C30 7 34 5 38 11" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function WhisklyLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
}: WhisklyLogoProps) {
  const isDark = variant === 'dark'
  const isHorizontal = variant === 'horizontal'
  const s = sizes[size]

  // Load DM Serif Display for placeholder wordmark treatment
  useEffect(() => {
    if (document.querySelector('#whiskly-font')) return
    const link = document.createElement('link')
    link.id = 'whiskly-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap'
    document.head.appendChild(link)
  }, [])

  const wordmarkStyle: React.CSSProperties = {
    fontFamily: "'DM Serif Display', 'Playfair Display', Georgia, serif",
    fontSize: `${s.wordmark}px`,
    fontWeight: 400,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    color: isDark ? '#f5f0eb' : '#2d1a0e',
    whiteSpace: 'nowrap' as const,
  }

  const italicStyle: React.CSSProperties = {
    fontStyle: 'italic',
    color: isDark ? '#c8906a' : '#8B4513',
  }

  const taglineStyle: React.CSSProperties = {
    fontSize: `${s.tagline}px`,
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: isDark ? '#f5f0eb' : '#5c3d2e',
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 1.6,
    fontFamily: "'Lato', Arial, sans-serif",
  }

  if (isHorizontal) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <WhiskIcon size={s.icon * 0.75} dark={false} />
        <span style={wordmarkStyle}>
          Whisk<span style={italicStyle}>ly</span>
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <WhiskIcon size={s.icon} dark={isDark} />
      <span style={wordmarkStyle}>
        Whisk<span style={italicStyle}>ly</span>
      </span>
      {showTagline && (
        <span style={taglineStyle}>
          Custom baked goods<br />made to order
        </span>
      )}
    </div>
  )
}