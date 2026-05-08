import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Groundwork Logbook',
  description: 'Field outreach log for the Groundwork team.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  )
}
