'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import WidgetFrame from './WidgetFrame'
import { WIDGET_REGISTRY } from '@/lib/widget-registry'
import { AlertCircle, Zap, Plus, X, Activity, Thermometer, Hash, TrendingUp, ChevronLeft } from 'lucide-react'
import { useEvents } from '@/context/EventContext'

interface WidgetData {
  id: string
  type: string
  posX: number
  posY: number
  w: number
  h: number
  data: any
}

export default function DraggableBoard() {
  const [widgets, setWidgets] = useState<WidgetData[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dailyData, setDailyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [selectionStep, setSelectionStep] = useState<'MAIN' | 'GOAL_STYLES'>('MAIN')
    const [bounds, setBounds] = useState({ width: 0, height: 0 })
    
    const boardRef = useRef<HTMLDivElement>(null)
    const { emitEvent } = useEvents()

    const GOAL_TEMPLATES = [
      { id: 'HUD', name: 'CYBER HUD', icon: <Activity size={18} />, desc: 'System metrics style' },
      { id: 'CIRCLE', name: 'RADIAL DISK', icon: <Zap size={18} />, desc: 'Circular progress' },
      { id: 'THERMOMETER', name: 'THERMO SCALE', icon: <Thermometer size={18} />, desc: 'Vertical accumulation' },
      { id: 'DIGITAL', name: 'MATRIX COUNT', icon: <Hash size={18} />, desc: 'High-contrast digital' },
      { id: 'SEGMENTS', name: 'BLOCKS', icon: <AlertCircle size={18} />, desc: 'Discrete segments' },
      { id: 'ROAD', name: 'ROADMAP', icon: <Zap size={18} />, desc: 'Linear progression' },
      { id: 'SPARKLINE', name: 'TREND LINE', icon: <TrendingUp size={18} />, desc: 'Growth visualization' },
      { id: 'CLASSIC', name: 'CLASSIC BAR', icon: <Plus size={18} />, desc: 'Standard progress' },
    ]

  useEffect(() => {
    fetchWidgets()
    updateBounds()
    window.addEventListener('resize', updateBounds)
    return () => window.removeEventListener('resize', updateBounds)
  }, [])

  const updateBounds = () => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      setBounds({ width: rect.width, height: rect.height })
    }
  }

  const fetchWidgets = async () => {
    try {
      const res = await fetch('/api/widgets')
      const data = await res.json()
      if (data.widgets) {
        setWidgets(data.widgets)
      }
      
      const dayRes = await fetch('/api/daily')
      const dayData = await dayRes.json()
      setDailyData(dayData.today)
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

  const handleAddWidget = async (type: string, data: any = {}) => {
    const config = WIDGET_REGISTRY[type]
    const res = await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        posX: 60, 
        posY: 60, 
        w: config?.minW || 300, 
        h: config?.minH || 250,
        data: { ...(config?.data || {}), ...data }
      })
    })
    
    if (res.ok) {
      const { widget } = await res.json()
      setWidgets(prev => [...prev, widget])
      setIsAdding(false)
      setSelectionStep('MAIN')
      emitEvent('WIDGET_MOVED', { id: widget.id, type: widget.type, status: 'ADDED' })
    }
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
             {dailyData && dailyData.status !== 'COMPLETED' && (
               <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bright)' }}>
                   <AlertCircle size={14} />
                   <span>ATTENTION: DAILY_MISSION_{dailyData.status} // {dailyData.status === 'PARTIAL' ? 'STREAK_STABLE' : 'CLOSE_GOALS_TO_MAINTAIN_STREAK'}</span>
               </div>
             )}
             {dailyData && dailyData.status === 'COMPLETED' && (
               <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                   <Zap size={14} fill="currentColor" />
                   <span>MISSION_ACCOMPLISHED // STREAK_PROTECTED</span>
               </div>
             )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`btn ${isAdding ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '11px', padding: '4px 12px' }}
            >
              {isAdding ? <X size={14} /> : <Plus size={14} />}
              <span style={{ marginLeft: '6px' }}>{isAdding ? 'CANCEL' : 'ADD WIDGET'}</span>
            </button>

            {isAdding && (
               <div className="panel animate-fade-in" style={{ 
                   position: 'absolute', 
                   top: '100%', 
                   right: 0, 
                   marginTop: '8px', 
                   width: '200px', 
                   zIndex: 200,
                   background: 'var(--bg-surface)',
                   boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
               }}>
                  <div className="panel-header" style={{ padding: '8px 12px' }}>
                    <div className="panel-title" style={{ fontSize: '10px' }}>AVAILABLE MODULES</div>
                  </div>
                  <div className="panel-body" style={{ padding: '8px' }}>
                    {selectionStep === 'MAIN' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Object.keys(WIDGET_REGISTRY).map(key => (
                            <button 
                            key={key} 
                            onClick={() => {
                                if (key === 'GOAL') {
                                    setSelectionStep('GOAL_STYLES')
                                } else {
                                    handleAddWidget(key)
                                }
                            }}
                            className="btn btn-ghost"
                            style={{ 
                                width: '100%', 
                                justifyContent: 'flex-start', 
                                fontSize: '11px', 
                                padding: '10px 12px',
                                border: key === 'GOAL' ? '1px solid var(--accent-dark)' : '1px solid transparent',
                                background: key === 'GOAL' ? 'rgba(255,0,0,0.05)' : 'transparent'
                            }}
                          >
                            <Plus size={12} style={{ marginRight: '8px', color: key === 'GOAL' ? 'var(--accent-bright)' : 'inherit' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 800 }}>{WIDGET_REGISTRY[key].defaultTitle}</span>
                                {key === 'GOAL' && <span style={{ fontSize: '8px', opacity: 0.5 }}>SELECT VISUAL_STYLE // 8 OPTIONS</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectionStep('MAIN')}
                          className="btn btn-ghost"
                          style={{ width: '100%', fontSize: '10px', padding: '4px', borderBottom: '1px solid var(--border-default)', marginBottom: '4px' }}
                        >
                          <ChevronLeft size={12} /> BACK TO MODULES
                        </button>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '8px' 
                        }}>
                          {GOAL_TEMPLATES.map(tpl => (
                            <button 
                              key={tpl.id}
                              onClick={() => handleAddWidget('GOAL', { style: tpl.id })}
                              className="panel animate-fade-in"
                              style={{ 
                                  padding: '8px', 
                                  cursor: 'pointer', 
                                  background: 'var(--bg-elevated)', 
                                  border: '1px solid var(--border-default)',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                              }}
                            >
                               <div style={{ color: 'var(--accent-bright)' }}>{tpl.icon}</div>
                               <div style={{ fontSize: '9px', fontWeight: 900 }} className="mono">{tpl.id}</div>
                               <div style={{ fontSize: '8px', opacity: 0.6 }}>{tpl.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            )}
          </div>

          <div className="mono text-dim">
              COORD: {activeId || 'IDLE'}
          </div>
        </div>
      </div>

      <div 
        ref={boardRef}
        style={{ 
          position: 'relative', 
          flex: 1,
      background: 'radial-gradient(circle at 50% 50%, #0d0d0d 0%, #080808 100%)',
      borderRadius: 'var(--border-radius)',
      border: '1px solid var(--border-default)',
      marginTop: 'var(--space-4)'
    }}>
      {/* Grid Pattern */}
      <div className="board-grid-pattern" style={{ opacity: 0.2 }} />

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
            bounds={bounds}
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
    </div>
  )
}
