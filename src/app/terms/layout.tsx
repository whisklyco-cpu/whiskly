import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Whiskly',
  description: 'Whiskly Terms of Service governing the use of our marketplace platform.',
  openGraph: {
    title: 'Terms of Service | Whiskly',
    description: 'Whiskly Terms of Service governing the use of our marketplace platform.',
    url: 'https://www.whiskly.co/terms',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Whiskly',
    description: 'Whiskly Terms of Service governing the use of our marketplace platform.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
