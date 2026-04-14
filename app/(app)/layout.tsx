import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

import ClientLayout from '@/components/layout/ClientLayout'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  return (
    <ClientLayout>
      <Sidebar userEmail={session.email} />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          {children}
        </div>
        <BottomNav />
      </div>
    </ClientLayout>
  )
}
