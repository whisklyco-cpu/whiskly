import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sell on Whiskly | Tools for Home Bakers',
  description: 'Sell your custom cakes on Whiskly. Free to join, 0% commission, structured booking and payments built for home bakers.',
  openGraph: {
    title: 'Sell on Whiskly | Tools for Home Bakers',
    description: 'Sell your custom cakes on Whiskly. Free to join, 0% commission, structured booking and payments built for home bakers.',
    url: 'https://www.whiskly.co/for-bakers',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sell on Whiskly | Tools for Home Bakers',
    description: 'Sell your custom cakes on Whiskly. Free to join, 0% commission, structured booking and payments built for home bakers.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
