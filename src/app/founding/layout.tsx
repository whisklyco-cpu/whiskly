import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Founding Baker Program | Whiskly',
  description: 'Join Whiskly as a Founding Baker. First 50 only — permanent 5% commission, $14/month locked pricing, and exclusive status for life.',
  openGraph: {
    title: 'Founding Baker Program | Whiskly',
    description: 'Join Whiskly as a Founding Baker. First 50 only — permanent 5% commission, $14/month locked pricing, and exclusive status for life.',
    url: 'https://www.whiskly.co/founding',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Founding Baker Program | Whiskly',
    description: 'Join Whiskly as a Founding Baker. First 50 only — permanent 5% commission, $14/month locked pricing, and exclusive status for life.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
