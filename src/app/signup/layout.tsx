import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | Whiskly',
  description: 'Create your Whiskly account to start booking local home bakers for custom cakes, cookies, and desserts.',
  openGraph: {
    title: 'Sign Up | Whiskly',
    description: 'Create your Whiskly account to start booking local home bakers for custom cakes, cookies, and desserts.',
    url: 'https://www.whiskly.co/signup',
    siteName: 'Whiskly',
    images: [{ url: 'https://www.whiskly.co/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up | Whiskly',
    description: 'Create your Whiskly account to start booking local home bakers for custom cakes, cookies, and desserts.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
