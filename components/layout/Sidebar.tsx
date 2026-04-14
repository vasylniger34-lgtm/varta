'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/life',
    label: 'LIFE',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="1"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 7h4M7 11h10"/>
      </svg>
    ),
  },
  {
    href: '/home',
    label: 'HOME',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12L12 3l9 9"/>
        <path d="M9 21V12h6v9"/>
        <rect x="3" y="12" width="18" height="9" rx="0" style={{display:'none'}}/>
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  {
    href: '/system',
    label: 'SYSTEM',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    href: '/training',
    label: 'TRAINING',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
]

import { useLayout } from './ClientLayout'

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSidebarOpen, setIsSidebarOpen } = useLayout()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`app-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            V<span className="sidebar-logo-accent">A</span>RT<span className="sidebar-logo-accent">A</span>
          </div>
          <div className="sidebar-logo-sub">Control System v1.0</div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            [CLOSE]
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-dot" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {userEmail}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '6px',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              border: '1px solid var(--border-default)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.color = 'var(--accent-bright)'
              ;(e.target as HTMLButtonElement).style.borderColor = 'var(--accent-dark)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.color = 'var(--text-dim)'
              ;(e.target as HTMLButtonElement).style.borderColor = 'var(--border-default)'
            }}
          >
            [ DISCONNECT ]
          </button>
        </div>
      </aside>
    </>
  )
}
