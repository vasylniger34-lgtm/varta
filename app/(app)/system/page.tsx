'use client'

import { useState, useEffect } from 'react'

type LogEntry = {
  id: string
  message: string
  level: string
  createdAt: string
}

type SysStats = {
  status: string
  user: { email: string; name: string | null; createdAt: string }
  taskStats: { total: number; done: number; pending: number }
  logs: LogEntry[]
}

export default function SystemPage() {
  const [stats, setStats] = useState<SysStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const res = await fetch('/api/system')
        const data = await res.json()
        if (data.status) setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSystemStats()
  }, [])

  if (loading) return <div className="animate-pulse" style={{ color: 'var(--text-dim)', padding: 'var(--space-6)' }}>SCANNING SYSTEM DIAGNOSTICS...</div>
  if (!stats) return <div style={{ color: 'var(--status-offline-text)', padding: 'var(--space-6)' }}>ERR: SYSTEM DIAGNOSTICS UNAVAILABLE</div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-label">MODULE_SYSTEM // MONITORING</div>
        <h1 className="page-title">SYSTEM DIAGNOSTICS</h1>
        <div className="page-desc">Core metrics and event telemetry.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        
        {/* SERVER STATUS */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">CORE HEALTH</div>
            <div className="status-badge online">{stats.status}</div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">OPERATOR:</span>
                <span>{stats.user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">DESIGNATION:</span>
                <span>{stats.user.name || 'UNKNOWN INDIVIDUAL'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">UPTIME:</span>
                <span className="text-accent">99.9%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">MEMORY_USAGE:</span>
                <span>124MB / 1024MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* OPERATIONS STATS */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">OPERATIONS METRICS</div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">TOTAL_TARGETS:</span>
                <span>{stats.taskStats.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">NEUTRALIZED:</span>
                <span style={{ color: 'var(--status-online)' }}>{stats.taskStats.done}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-dim">PENDING:</span>
                <span className="text-accent">{stats.taskStats.pending}</span>
              </div>
              <div style={{ marginTop: 'var(--space-4)', height: '4px', background: 'var(--bg-elevated)', display: 'flex' }}>
                <div style={{ height: '100%', background: 'var(--status-online)', width: `${stats.taskStats.total ? (stats.taskStats.done / stats.taskStats.total) * 100 : 0}%`, transition: 'width 1s ease' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* EVENT LOG */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">SYSTEM EVENT LOG</div>
        </div>
        <div className="panel-body" style={{ background: '#050505', fontFamily: 'var(--font-mono)', fontSize: '11px', height: '300px', overflowY: 'auto' }}>
          {stats.logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-1) 0', color: log.level === 'ERROR' ? 'var(--status-offline-text)' : log.level === 'WARN' ? 'var(--warning)' : 'var(--text-dim)' }}>
              <span style={{ opacity: 0.5 }}>[{new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}]</span>
              <span style={{ width: '50px' }}>{log.level}</span>
              <span style={{ color: log.level === 'ERROR' ? 'var(--status-offline-text)' : 'var(--text-secondary)' }}>{log.message}</span>
            </div>
          ))}
          {stats.logs.length === 0 && <div className="text-dim">NO EVENTS RECORDED</div>}
        </div>
      </div>

    </div>
  )
}
