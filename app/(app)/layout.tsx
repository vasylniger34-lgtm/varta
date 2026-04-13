import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  return (
    <div className="app-root">
      <Sidebar userEmail={session.email} />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  )
}
