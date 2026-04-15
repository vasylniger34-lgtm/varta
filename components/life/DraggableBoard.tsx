'use client'

import { useState, useEffect, useMemo } from 'react'
import WidgetFrame from './WidgetFrame'
import { WIDGET_REGISTRY } from '@/lib/widget-registry'
import { AlertCircle, Zap } from 'lucide-react'

interface WidgetData {
  id: string
  type: string
  posX: number
  posY: number
  w: number
  h: number
  data: any
}

import { WIDGET_REGISTRY } from '@/lib/widget-registry'

export default function DraggableBoard() {
  const [widgets, setWidgets] = useState<WidgetData[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dayStatus, setDayStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWidgets()
  }, [])

  const fetchWidgets = async () => {
    try {
      const res = await fetch('/api/widgets')
      const data = await res.json()
      if (data.widgets) {
        setWidgets(data.widgets)
      }
      
      const dayRes = await fetch('/api/daily')
      const dayData = await dayRes.json()
      setDayStatus(dayData.today)
    } catch (e) {
      console.error('Failed to fetch widgets', e)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (id: string, x: number, y: number) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, posX: x, posY: y } : w))
    await fetch('/api/widgets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, posX: x, posY: y })
    })
  }

  const handleResize = async (id: string, w: number, h: number) => {
    setWidgets(prev => prev.map(widget => widget.id === id ? { ...widget, w, h } : widget))
    await fetch('/api/widgets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, w, h })
    })
  }

  const handleDelete = async (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    await fetch(`/api/widgets?id=${id}`, { method: 'DELETE' })
  }

  const dayStatus = useMemo(() => {
    // Find the Day Goals widget or just check the current day
    // For simplicity, let's assume we want to alert based on the day's record in DB
    // We could pass it down from the widget, or fetch it here.
    // Given the board needs to be "alive", I'll add a state for it.
    return widgets.find(w => w.type === 'DAY_GOALS') // In a real app we'd fetch the day record
  }, [widgets])

  if (loading) return <div className="text-dim p-8">INITIALIZING BOARD...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
      
      {/* System Status Bar / Reactions */}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--border-radius)',
          fontSize: '11px',
          letterSpacing: '0.1em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span className="text-dim">SYSTEM_STATE:</span>
             <span className="status-badge online">OPERATIONAL</span>
             
             {/* Reaction Logic */}
             {dayStatus && dayStatus.status !== 'COMPLETED' && (
               <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bright)' }}>
                   <AlertCircle size={14} />
                   <span>ATTENTION: DAILY_MISSION_{dayStatus.status} // {dayStatus.status === 'PARTIAL' ? 'STREAK_STABLE' : 'CLOSE_GOALS_TO_MAINTAIN_STREAK'}</span>
               </div>
             )}
             {dayStatus && dayStatus.status === 'COMPLETED' && (
               <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                   <Zap size={14} fill="currentColor" />
                   <span>MISSION_ACCOMPLISHED // STREAK_PROTECTED</span>
               </div>
             )}
        </div>
        
        <div className="mono text-dim">
            COORD: {activeId || 'IDLE'}
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        flex: 1,
      background: 'radial-gradient(circle at 50% 50%, #0d0d0d 0%, #080808 100%)',
      borderRadius: 'var(--border-radius)',
      border: '1px solid var(--border-default)',
      marginTop: 'var(--space-4)'
    }}>
      {/* Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(var(--border-default) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.2,
        pointerEvents: 'none'
      }} />

      {widgets.map(widget => {
        const config = WIDGET_REGISTRY[widget.type] || {}
        const WidgetComponent = config.component

        return (
          <WidgetFrame
            key={widget.id}
            id={widget.id}
            type={widget.type}
            title={config.defaultTitle || widget.type.replace('_', ' ')}
            posX={widget.posX}
            posY={widget.posY}
            w={widget.w}
            h={widget.h}
            onMove={handleMove}
            onResize={handleResize}
            onDelete={handleDelete}
            isActive={activeId === widget.id}
            onClick={() => setActiveId(widget.id)}
          >
            {WidgetComponent ? (
               <WidgetComponent 
                 widgetId={widget.id} 
                 initialData={widget.data} 
               />
            ) : (
                <div className="text-dim text-xs">UNKNOWN_WIDGET_TYPE: {widget.type}</div>
            )}
          </WidgetFrame>
        )
      })}
    </div>
  )
}
