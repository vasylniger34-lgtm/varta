'use client'

import { useState, useEffect } from 'react'
import WidgetFrame from './WidgetFrame'
import DayGoalsWidget from './widgets/DayGoalsWidget'
import NotesWidget from './widgets/NotesWidget'

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
    } catch (e) {
      console.error('Failed to fetch widgets', e)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (id: string, x: number, y: number) => {
    // Optimistic update
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, posX: x, posY: y } : w))

    // DB Sync (Debounced in a real app, but direct for now)
    await fetch('/api/widgets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, posX: x, posY: y })
    })
  }

  const handleDelete = async (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    await fetch(`/api/widgets?id=${id}`, { method: 'DELETE' })
  }

  if (loading) return <div className="text-dim p-8">INITIALIZING BOARD...</div>

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: 'calc(100vh - var(--topbar-height) - 160px)',
      overflow: 'hidden',
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

      {widgets.map(widget => (
        <WidgetFrame
          key={widget.id}
          id={widget.id}
          title={widget.type.replace('_', ' ')}
          posX={widget.posX}
          posY={widget.posY}
          w={widget.w}
          h={widget.h}
          onMove={handleMove}
          onDelete={handleDelete}
        >
          {widget.type === 'DAY_GOALS' && <DayGoalsWidget />}
          {widget.type === 'NOTES' && <NotesWidget widgetId={widget.id} initialData={widget.data} />}
        </WidgetFrame>
      ))}
    </div>
  )
}
