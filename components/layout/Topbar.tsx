import { useLayout } from './ClientLayout'

export default function Topbar() {
  const pathname = usePathname()
  const [time, setTime] = useState<string>('')
  const { toggleSidebar } = useLayout()

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="topbar-title">
          {moduleName} // module
        </div>
      </div>
      
      <div className="topbar-meta">
        <div className="topbar-meta-item">
          <span style={{ color: 'var(--text-secondary)' }}>NET:</span>
          <span style={{ color: 'var(--status-online)' }}>SECURE</span>
        </div>
        <div className="topbar-meta-item">
          <span style={{ color: 'var(--text-secondary)' }}>SYS:</span>
          <span>{time || 'SYNCING...'}</span>
        </div>
      </div>
    </header>
  )
}
