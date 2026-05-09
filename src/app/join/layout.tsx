import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply as a Baker | Whiskly',
  description: 'Apply to join Whiskly as a baker. Free to join, 0% commission, professional tools for independent home bakers.',
  openGraph: {
    title: 'Apply as a Baker | Whiskly',
    description: 'Apply to join Whiskly as a baker. Free to join, 0% commission, professional tools for independent home bakers.',
    url: 'https://www.whiskly.co/join',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply as a Baker | Whiskly',
    description: 'Apply to join Whiskly as a baker. Free to join, 0% commission, professional tools for independent home bakers.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
