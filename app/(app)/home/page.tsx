'use client'

import { useState } from 'react'

export default function HomePage() {
  const [loading, setLoading] = useState(false)

  // Mock devices based on requirement
  const mockDevices = {
    cameras: [
      { id: 'cam1', name: 'EXT_FRONT_CAM', status: 'online' },
      { id: 'cam2', name: 'INT_GARAGE_CAM', status: 'offline' },
    ],
    light: [
      { id: 'l1', name: 'ZONE_MAIN_LIGHT', status: 'online', on: true },
      { id: 'l2', name: 'ZONE_WORK_LIGHT', status: 'online', on: false },
    ],
    sockets: [
      { id: 's1', name: 'PWR_DESK_MAIN', status: 'online', on: true },
      { id: 's2', name: 'PWR_SERVER_RACK', status: 'online', on: true },
    ]
  }

  const [devices, setDevices] = useState(mockDevices)

  const toggleDevice = (category: 'light'|'sockets', id: string) => {
    setLoading(true)
    setTimeout(() => {
      setDevices(prev => ({
        ...prev,
        [category]: prev[category].map(d => d.id === id ? { ...d, on: !d.on } : d)
      }))
      setLoading(false)
    }, 400) // mock latency
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-label">MODULE_HOME // STANDBY</div>
        <h1 className="page-title">FACILITY CONTROL</h1>
        <div className="page-desc">Hardware grid telemetry and environmental toggles. (SIMULATION MODE)</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* LIGHTS PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">ILLUMINATION / LIGHTS</div>
            <div className="status-badge online">ACTIVE</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {devices.light.map(device => (
              <div key={device.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className={`status-dot ${device.status}`}></div>
                  <span style={{ fontSize: 'var(--text-sm)', color: device.on ? 'var(--text-primary)' : 'var(--text-dim)' }}>{device.name}</span>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={device.on} onChange={() => toggleDevice('light', device.id)} disabled={loading} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* SOCKETS PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">POWER GRID / SOCKETS</div>
            <div className="status-badge online">ACTIVE</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {devices.sockets.map(device => (
              <div key={device.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className={`status-dot ${device.status}`}></div>
                  <span style={{ fontSize: 'var(--text-sm)', color: device.on ? 'var(--text-primary)' : 'var(--text-dim)' }}>{device.name}</span>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={device.on} onChange={() => toggleDevice('sockets', device.id)} disabled={loading} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* CAMERAS PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">SURVEILLANCE / CAMERAS</div>
            <div className="status-badge offline">ERR_02</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {devices.cameras.map(device => (
              <div key={device.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className={`status-dot ${device.status}`}></div>
                  <span style={{ fontSize: 'var(--text-sm)', color: device.status === 'online' ? 'var(--text-primary)' : 'var(--text-dim)' }}>{device.name}</span>
                </div>
                <span className="text-xs text-dim">
                  {device.status === 'online' ? '[ LINK OK ]' : '[ NO SIGNAL ]'}
                </span>
              </div>
            ))}
            <div style={{ 
              marginTop: 'var(--space-4)', 
              padding: 'var(--space-8)', 
              background: 'var(--bg-base)', 
              border: '1px dashed var(--status-offline)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--status-offline-text)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.2em'
            }}>
              VIDEO FEED UNAVAILABLE
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
