
import "./globals.css";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Journal',
  description: 'Track daily trades with Next.js and Sanity',
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={``}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
