import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import AttributionCapture from "@/components/AttributionCapture";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: 'Whiskly | Custom Cakes from Local Home Bakers',
  description: 'Book local home bakers for custom cakes, cookies, and desserts. Clear pricing, structured ordering, and secure payments. No more Instagram DMs.',
  openGraph: {
    title: 'Whiskly | Custom Cakes from Local Home Bakers',
    description: 'Book local home bakers for custom cakes, cookies, and desserts. Clear pricing, structured ordering, and secure payments. No more Instagram DMs.',
    url: 'https://www.whiskly.co',
    siteName: 'Whiskly',
    images: [
      {
        url: 'https://www.whiskly.co/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Whiskly — Custom Cakes from Local Home Bakers',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whiskly | Custom Cakes from Local Home Bakers',
    description: 'Book local home bakers for custom cakes, cookies, and desserts. Clear pricing, structured ordering, and secure payments. No more Instagram DMs.',
    images: ['https://www.whiskly.co/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${playfair.variable} ${lato.variable} antialiased`}>
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}