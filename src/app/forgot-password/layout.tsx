import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password | Whiskly',
  description: 'Reset your Whiskly account password.',
  openGraph: {
    title: 'Reset Password | Whiskly',
    description: 'Reset your Whiskly account password.',
    url: 'https://www.whiskly.co/forgot-password',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reset Password | Whiskly',
    description: 'Reset your Whiskly account password.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
