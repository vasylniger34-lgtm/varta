import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ClientLayout from '@/components/layout/ClientLayout'
import BottomNav from '@/components/layout/BottomNav'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'VARTA Mobile — Neural Interface',
  description: 'VARTA Control System for Mobile Devices',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VARTA Mobile',
  },
}

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  return (
    <ClientLayout>
      <div className="mobile-app-root">
        <main className="mobile-app-main">
          {children}
        </main>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
              console.log('SW registered');
            }, function(err) {
              console.log('SW failed: ', err);
            });
          });
        }
      `}} />
    </ClientLayout>
  )
}
