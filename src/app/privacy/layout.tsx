import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Whiskly',
  description: 'How Whiskly collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | Whiskly',
    description: 'How Whiskly collects, uses, and protects your personal information.',
    url: 'https://www.whiskly.co/privacy',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Whiskly',
    description: 'How Whiskly collects, uses, and protects your personal information.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
