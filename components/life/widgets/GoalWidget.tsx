'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Target, TrendingUp, DollarSign, Check, ChevronLeft, 
  Zap, Thermometer, Hash, Activity, X, Plus, Milestone, Layout, 
  Circle, Grid, Settings2, Trash2, Palette
} from 'lucide-react'
import { useEvents } from '@/context/EventContext'

const STYLES = [
  { id: 'CLASSIC', name: 'CLASSIC BAR', icon: <Layout size={14} /> },
  { id: 'CIRCLE', name: 'RADIAL DISK', icon: <Circle size={14} /> },
  { id: 'THERMOMETER', name: 'THERMO SCALE', icon: <Thermometer size={14} /> },
  { id: 'DIGITAL', name: 'MATRIX COUNT', icon: <Hash size={14} /> },
  { id: 'HUD', name: 'CYBER HUD', icon: <Activity size={14} /> },
  { id: 'SEGMENTS', name: 'BLOCKS', icon: <Grid size={14} /> },
  { id: 'ROAD', name: 'ROADMAP', icon: <Milestone size={14} /> },
  { id: 'SPARKLINE', name: 'TREND LINE', icon: <TrendingUp size={14} /> },
]

export default function GoalWidget({ widgetId, initialData }: any) {
  const [goal, setGoal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpdate, setShowUpdate] = useState(false)
  const [addValue, setAddValue] = useState('')
  
  // Setup Form State
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState(100)

  const { emitEvent } = useEvents()

  const fetchGoal = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/goals`)
      const data = await res.json()
      const g = data.goals.find((item: any) => item.id === id)
      if (g) setGoal(g)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData?.goalId) {
      fetchGoal(initialData.goalId)
    } else {
      setLoading(false)
    }
  }, [initialData, fetchGoal])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        targetValue: target, 
        style: initialData?.style || 'HUD',
        type: 'task',
        color: '#ff0000'
      })
    })

    if (res.ok) {
        const { goal: newGoal } = await res.json()
        setGoal(newGoal)
        
        // Link goal to widget and enable HUD mode
        await fetch('/api/widgets', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: widgetId, 
                data: { ...initialData, goalId: newGoal.id, minimalMode: true } 
            })
        })
        emitEvent('WIDGET_UPDATED', { id: widgetId })
    }
  }

  const handleQuickUpdate = async () => {
    if (!goal || !addValue) return
    const newValue = goal.currentValue + parseFloat(addValue)
    
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, currentValue: newValue })
    })
    
    if (res.ok) {
      setGoal({ ...goal, currentValue: newValue })
      setAddValue('')
      setShowUpdate(false)
      emitEvent('GOAL_UPDATED', { id: goal.id, value: newValue })
    }
  }

  if (loading) return <div className="animate-pulse text-dim p-4 mono text-[10px]">SYNCING_DATA...</div>

  // SETUP MODE: No goal linked yet
  if (!goal) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-4">
        <div className="text-[10px] text-dim mono uppercase mb-2">Configure Objective // {initialData?.style}</div>
        <form onSubmit={handleCreate} className="w-full space-y-4">
          <div>
            <input 
              className="input-field w-full"
              placeholder="GOAL NAME..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <div className="text-[8px] text-dim mono mb-1">TARGET_VOLUME ($)</div>
            <input 
              type="number"
              className="input-field w-full"
              value={target}
              onChange={e => setTarget(parseFloat(e.target.value))}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-2 mono text-[10px] font-bold">
            INITIATE_TRACKING
          </button>
        </form>
      </div>
    )
  }

  // HUD MODE
  const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
  const color = goal.color || 'var(--accent-bright)'

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-2 group overflow-hidden">
      
      {/* Clickable Diagram */}
      <div 
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-500"
        onClick={() => setShowUpdate(!showUpdate)}
      >
        {renderDiagram(goal.style || 'HUD', goal, progress, color)}
      </div>

      {/* Main Label/Value (Always Minimal) */}
      <div className="mt-2 text-center">
        <div className="text-sm font-black mono text-white tracking-widest leading-none">
          {goal.currentValue.toLocaleString()}$
        </div>
        <div className="text-[8px] text-dim mono uppercase mt-1">
          {goal.title} // {Math.round(progress)}%
        </div>
      </div>

      {/* Quick Add Overlay */}
      {showUpdate && (
        <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-4 animate-fade-in border border-accent-dark rounded-xl">
           <div className="text-[10px] text-accent-bright mono mb-4 uppercase font-bold">INCREMENT_PROGRESS</div>
           <div className="flex gap-2 w-full">
              <input 
                type="number"
                className="input-field flex-1"
                placeholder="+ AMOUNT"
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleQuickUpdate()}
              />
              <button 
                onClick={handleQuickUpdate}
                className="bg-accent-bright text-white p-2 rounded hover:brightness-125 transition-all"
              >
                <Check size={18} />
              </button>
           </div>
           <button 
             onClick={() => setShowUpdate(false)}
             className="mt-4 text-[8px] text-dim hover:text-white mono uppercase"
           >
              CANCEL_OPERATION
           </button>
        </div>
      )}

      {/* Persistent Settings (Tiny icon on hover) */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <Settings2 
           size={12} 
           className="text-dim hover:text-white cursor-pointer" 
           onClick={() => {
              // Reset to setup mode or open settings modal
              // For now, let's just allow toggling minimalMode via board if needed
           }}
         />
      </div>
    </div>
  )
}

function renderDiagram(style: string, goal: any, progress: number, color: string) {
    switch (style) {
        case 'CIRCLE':
            const radius = 30
            const circumference = 2 * Math.PI * radius
            const offset = circumference - (progress / 100) * circumference
            return (
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                    <circle
                        cx="40" cy="40" r={radius} fill="transparent" stroke={color} strokeWidth="6"
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="square"
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        transform="rotate(-90 40 40)"
                    />
                </svg>
            )
        case 'THERMOMETER':
            return (
                <div className="w-8 h-24 bg-white/5 rounded-full relative p-1 border border-white/5 overflow-hidden">
                    <div 
                        className="absolute bottom-1 left-1 right-1 rounded-full transition-all duration-1000 ease-out"
                        style={{ height: `calc(${progress}% - 8px)`, background: `linear-gradient(to top, ${color}cc, ${color})` }} 
                    />
                </div>
            )
        case 'DIGITAL':
            return <Hash size={48} className="text-accent-bright animate-pulse" />
        case 'SEGMENTS':
            return (
                <div className="flex gap-1 h-3 w-32">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ 
                            background: (i + 1) * 12.5 <= progress ? color : 'rgba(255,255,255,0.05)',
                            boxShadow: (i + 1) * 12.5 <= progress ? `0 0 8px ${color}` : 'none'
                        }} />
                    ))}
                </div>
            )
        case 'HUD':
        default:
            return (
                <div className="relative">
                    <Activity size={48} className="text-accent-bright" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
                    <div className="absolute -inset-2 border border-accent-bright/20 rounded-full animate-spin-slow" />
                </div>
            )
    }
}
