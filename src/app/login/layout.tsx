import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | Whiskly',
  description: 'Sign in to your Whiskly account to manage orders, bookings, and your baker profile.',
  openGraph: {
    title: 'Sign In | Whiskly',
    description: 'Sign in to your Whiskly account to manage orders, bookings, and your baker profile.',
    url: 'https://www.whiskly.co/login',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In | Whiskly',
    description: 'Sign in to your Whiskly account to manage orders, bookings, and your baker profile.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
