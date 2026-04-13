'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Topbar() {
  const pathname = usePathname()
  const [time, setTime] = useState<string>('')

  // Get active module name from pathname
  const moduleName = pathname.split('/')[1] || 'dashboard'

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // format: YYYY.MM.DD [HH:MM:SS] LOC:UKY
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false })
      
      setTime(`${y}.${m}.${d} [${timeStr}] LOC:UKY`)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="app-topbar">
      <div className="topbar-title">
        {moduleName} // module
      </div>
      
      <div className="topbar-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>NET:</span>
          <span style={{ color: 'var(--status-online)' }}>SECURE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>SYS:</span>
          <span>{time || 'SYNCING...'}</span>
        </div>
      </div>
    </header>
  )
}
