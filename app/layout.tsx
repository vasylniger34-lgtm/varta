import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VARTA — Control System',
  description: 'Life Management & Smart Home Control Panel',
  keywords: ['life management', 'smart home', 'productivity', 'control system'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  )
}
