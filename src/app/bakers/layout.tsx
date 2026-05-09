import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Bakers | Whiskly',
  description: 'Find verified home bakers near you for custom cakes, cookies, and desserts. Filter by specialty, dietary needs, and price.',
  openGraph: {
    title: 'Browse Bakers | Whiskly',
    description: 'Find verified home bakers near you for custom cakes, cookies, and desserts. Filter by specialty, dietary needs, and price.',
    url: 'https://www.whiskly.co/bakers',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Bakers | Whiskly',
    description: 'Find verified home bakers near you for custom cakes, cookies, and desserts. Filter by specialty, dietary needs, and price.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
