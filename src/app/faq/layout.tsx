import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | Whiskly',
  description: 'Common questions about ordering custom cakes through Whiskly, baker pricing, delivery, and platform features.',
  openGraph: {
    title: 'FAQ | Whiskly',
    description: 'Common questions about ordering custom cakes through Whiskly, baker pricing, delivery, and platform features.',
    url: 'https://www.whiskly.co/faq',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Whiskly',
    description: 'Common questions about ordering custom cakes through Whiskly, baker pricing, delivery, and platform features.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
