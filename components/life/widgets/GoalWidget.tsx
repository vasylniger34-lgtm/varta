'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Target, TrendingUp, Edit3, DollarSign, Check, ChevronRight, ChevronLeft, 
  Zap, Thermometer, Hash, Activity, X, Plus, Milestone, Layout, 
  Circle, Grid, Play, AlertCircle, Info, Settings2, Trash2, Palette
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

const COLORS = [
  '#ff0000', '#00f2ff', '#00ff1a', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'
]

export default function GoalWidget() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form State
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState(100)
  const [newStyle, setNewStyle] = useState('CLASSIC')
  const [newColor, setNewColor] = useState('#ff0000')
  const [newIcon, setNewIcon] = useState('Target')

  const { emitEvent } = useEvents()

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.goals || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTitle, 
        targetValue: newTarget, 
        style: newStyle,
        color: newColor,
        icon: newIcon,
        type: 'task' 
      })
    })

    if (res.ok) {
        const { goal } = await res.json()
        setGoals(prev => [goal, ...prev])
        setNewTitle('')
        setIsAdding(false)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Видалити цю ціль?')) {
        const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setGoals(prev => prev.filter(g => g.id !== id))
        }
    }
  }

  const handleUpdate = async (id: string, currentValue: number) => {
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, currentValue })
    })
    
    if (res.ok) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue } : g))
      emitEvent('GOAL_UPDATED', { id, value: currentValue })
    }
  }

  const cycleStyle = async (goal: any) => {
    const sIds = STYLES.map(s => s.id)
    const currentIndex = sIds.indexOf(goal.style || 'CLASSIC')
    const nextIndex = (currentIndex + 1) % sIds.length
    const nextStyle = sIds[nextIndex]
    
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, style: nextStyle } : g))
    
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, style: nextStyle })
    })
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-dim mono text-xs uppercase animate-pulse">
       <Activity size={24} className="text-accent-bright" />
       Establishing neural link with strategic objectives...
    </div>
  )

  return (
    <div className="flex flex-col h-full gap-4 relative overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="flex justify-between items-center px-2">
         <div className="mono text-[10px] text-dim flex items-center gap-2">
            <Activity size={12} className="text-accent-bright" />
            GOAL_SYSTEM_ACTIVE // {goals.length} UNITS
         </div>
         <button 
           onClick={() => setIsAdding(!isAdding)} 
           className={`btn ${isAdding ? 'btn-primary' : 'btn-ghost'} flex items-center gap-2`}
           style={{ padding: '4px 12px', fontSize: '10px' }}
         >
            {isAdding ? <X size={12} /> : <Plus size={12} />}
            {isAdding ? 'CANCEL_DEPLOY' : 'NEW_GOAL'}
         </button>
      </div>

      {/* Modern Multi-Style Form */}
      {isAdding && (
          <form onSubmit={handleAddGoal} className="panel animate-slide-down" style={{ 
              padding: '20px', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--accent-dark)',
              borderRadius: '12px',
              zIndex: 50
          }}>
              <div className="mb-4">
                  <div className="text-[9px] text-dim mono mb-1">OBJECTIVE_IDENTIFIER</div>
                  <input 
                    className="input-field" 
                    placeholder="ENTER TITLE..." 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={{ fontSize: '14px', fontWeight: 600 }}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <div className="text-[9px] text-dim mono mb-1">TARGET_VALUE</div>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newTarget}
                      onChange={e => setNewTarget(parseFloat(e.target.value))}
                    />
                 </div>
                 <div>
                    <div className="text-[9px] text-dim mono mb-1">INITIAL_CURRENT</div>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="0"
                      onChange={e => {/* handle initial value if needed */}}
                    />
                 </div>
              </div>

              <div className="mb-4">
                  <div className="text-[9px] text-dim mono mb-2">INTERFACE_STYLE</div>
                  <div className="grid grid-cols-4 gap-2">
                     {STYLES.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setNewStyle(s.id)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${newStyle === s.id ? 'border-accent-bright bg-accent-glow' : 'border-dim/20 bg-base/40 hover:border-dim/40'}`}
                        >
                           <div className={newStyle === s.id ? 'text-accent-bright' : 'text-dim'}>{s.icon}</div>
                           <span className="text-[8px] mono truncate w-full text-center">{s.id}</span>
                        </button>
                     ))}
                  </div>
              </div>

              <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                      <div className="text-[9px] text-dim mono mb-2">SPECTRUM_COLOR</div>
                      <div className="flex gap-2">
                          {COLORS.map(c => (
                             <button
                               key={c}
                               type="button"
                               onClick={() => setNewColor(c)}
                               style={{ background: c, width: '20px', height: '20px', borderRadius: '50%', border: newColor === c ? '2px solid #fff' : 'none' }}
                             />
                          ))}
                      </div>
                  </div>
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 mono font-bold text-xs">
                 INITIATE_STRATEGIC_GOAL
              </button>
          </form>
      )}

      {/* Goals Display */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 custom-scrollbar">
        {goals.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
             <Target size={48} className="mb-4" />
             <div className="mono text-xs uppercase tracking-widest">Awaiting Objectives...</div>
          </div>
        )}

        {goals.map(goal => (
          <GoalCard 
            key={goal.id} 
            goal={goal} 
            onUpdate={handleUpdate} 
            onDelete={handleDeleteGoal} 
            onCycleStyle={cycleStyle}
            editingId={editingId}
            setEditingId={setEditingId}
          />
        ))}
      </div>
    </div>
  )
}

function GoalCard({ goal, onUpdate, onDelete, onCycleStyle, editingId, setEditingId }: any) {
    const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
    const style = goal.style || 'CLASSIC'
    const color = goal.color || 'var(--accent-bright)'

    const isMilestone = progress >= 100 || progress === 75 || progress === 50 || progress === 25

    return (
        <div className={`group relative p-4 bg-[#0a0a0a] border border-white/5 rounded-xl transition-all duration-500 hover:border-white/10 ${isMilestone && progress >= 100 ? 'ring-1 ring-accent-glow shadow-[0_0_20px_rgba(255,0,0,0.1)]' : ''}`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-dim group-hover:text-accent-bright transition-colors">
                        <Target size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-black mono text-white/90 uppercase letter-spacing-1">{goal.title}</div>
                        <div className="text-[9px] text-dim mono mt-0.5">{style} // {goal.type.toUpperCase()}</div>
                    </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onCycleStyle(goal)} className="p-1 hover:bg-white/5 rounded text-dim hover:text-white transition-colors" title="Change Visual Skin">
                        <Palette size={14} />
                    </button>
                    <button onClick={() => setEditingId(editingId === goal.id ? null : goal.id)} className="p-1 hover:bg-white/5 rounded text-dim hover:text-white transition-colors">
                        <Settings2 size={14} />
                    </button>
                    <button onClick={() => onDelete(goal.id)} className="p-1 hover:bg-white/5 rounded text-dim hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Rendering Engine */}
            <div className="mb-2">
                {renderGoalStyle(style, goal, progress, color)}
            </div>

            {/* Milestone Indicator */}
            {progress >= 100 && (
                <div className="absolute top-2 right-2 animate-bounce">
                    <Zap size={14} className="text-accent-bright fill-accent-bright" />
                </div>
            )}

            {/* Inline Editor */}
            {editingId === goal.id && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 animate-slide-up">
                    <div className="flex-1 relative">
                        <input 
                          type="number"
                          className="input-field pl-8"
                          style={{ fontSize: '11px', height: '32px' }}
                          defaultValue={goal.currentValue}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdate(goal.id, parseFloat((e.target as HTMLInputElement).value))
                              setEditingId(null)
                            }
                          }}
                        />
                        <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                    </div>
                    <button 
                      onClick={() => {
                          const input = document.querySelector(`input[defaultValue="${goal.currentValue}"]`) as HTMLInputElement
                          if(input) onUpdate(goal.id, parseFloat(input.value))
                          setEditingId(null)
                      }}
                      className="btn btn-primary px-3"
                    >
                       <Check size={14} />
                    </button>
                </div>
            )}
        </div>
    )
}

function renderGoalStyle(style: string, goal: any, progress: number, color: string) {
  switch (style) {
    case 'CIRCLE':
      const radius = 32
      const circumference = 2 * Math.PI * radius
      const offset = circumference - (progress / 100) * circumference
      return (
        <div className="flex items-center gap-6 py-2">
            <div className="relative w-24 h-24">
                <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <circle
                        cx="48" cy="48" r={radius} fill="transparent" stroke={color} strokeWidth="8"
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="square"
                        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        transform="rotate(-90 48 48)"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black mono text-white">{Math.round(progress)}%</span>
                </div>
            </div>
            <div className="flex-1 space-y-1">
                <div className="text-2xl font-black text-white">{goal.currentValue.toLocaleString()}</div>
                <div className="text-[10px] text-dim mono uppercase tracking-wider">Target: {goal.targetValue.toLocaleString()}</div>
                <div className="flex gap-1 h-1 w-full mt-2">
                    <div className="h-full bg-accent-bright" style={{ width: '30%', opacity: 0.2 }} />
                    <div className="h-full bg-accent-bright" style={{ width: '40%', opacity: 0.1 }} />
                </div>
            </div>
        </div>
      )

    case 'THERMOMETER':
      return (
        <div className="flex gap-6 items-end py-2">
          <div className="w-10 h-32 bg-white/5 rounded-full relative p-1 border border-white/5 overflow-hidden">
            <div 
              className="absolute bottom-1 left-1 right-1 rounded-full transition-all duration-1000 ease-out"
              style={{ height: `calc(${progress}% - 8px)`, background: `linear-gradient(to top, ${color}cc, ${color})`, boxShadow: `0 0 15px ${color}44` }} 
            />
            <div className="absolute inset-0 flex items-center justify-center mix-blend-overlay">
                <div className="w-[1px] h-full bg-white/20" />
            </div>
          </div>
          <div className="flex-1 pb-2">
             <div className="text-[10px] text-dim mono mb-1 tracking-widest">THERMAL_EXPANSION</div>
             <div className="text-3xl font-black mb-1" style={{ color: color }}>{progress.toFixed(1)}%</div>
             <div className="text-xs text-white/60 mb-1">{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}</div>
             <div className="h-[2px] w-full bg-white/5 mt-2">
                <div className="h-full bg-white/20" style={{ width: '100%' }} />
             </div>
          </div>
        </div>
      )

    case 'DIGITAL':
      return (
        <div className="py-4 border-y border-white/5 bg-white/[0.02] rounded-lg px-4">
           <div className="flex justify-between items-baseline mb-2">
                <div className="text-4xl font-black mono tracking-tighter" style={{ color: color, textShadow: `0 0 20px ${color}33` }}>
                    {goal.currentValue.toLocaleString()}
                </div>
                <div className="text-xs text-dim mono">DATA_VALUE</div>
           </div>
           <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col">
                    <span className="text-[9px] text-dim mono">TOTAL_TARGET</span>
                    <span className="text-xs font-bold">{goal.targetValue.toLocaleString()}</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="flex-1 flex flex-col text-right">
                    <span className="text-[9px] text-dim mono">RESIDUAL_DEBT</span>
                    <span className="text-xs font-bold text-accent-bright">{(goal.targetValue - goal.currentValue).toLocaleString()}</span>
                </div>
           </div>
        </div>
      )

    case 'HUD':
      return (
        <div className="mono border-l-2 border-accent-bright bg-accent-glow/5 p-4 space-y-3">
           <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="space-y-1">
                    <div className="text-dim opacity-50"># STATUS_CODE</div>
                    <div className="text-accent-bright font-bold">{progress >= 100 ? 'SUCCESS_SYNC' : 'BUSY_DEPLOYING'}</div>
                </div>
                <div className="space-y-1 text-right">
                    <div className="text-dim opacity-50"># EFFICIENCY</div>
                    <div className="text-white">{progress.toFixed(2)}%</div>
                </div>
           </div>
           <div className="space-y-1">
                <div className="text-[10px] text-dim opacity-50"># QUANTUM_LOAD</div>
                <div className="text-2xl font-black text-white italic tracking-tighter">
                   {goal.currentValue.toLocaleString()} <span className="text-xs opacity-30">/ {goal.targetValue.toLocaleString()}</span>
                </div>
           </div>
           <div className="relative h-1 bg-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-accent-bright/20 animate-pulse" />
                <div className="absolute h-full bg-accent-bright" style={{ width: `${progress}%` }} />
           </div>
        </div>
      )

    case 'SEGMENTS':
      const segments = Array.from({ length: 10 })
      return (
        <div className="py-2">
           <div className="flex gap-1 mb-4 h-6">
              {segments.map((_, i) => (
                <div key={i} className="flex-1 relative transition-all duration-300" style={{ 
                    background: (i + 1) * 10 <= progress ? color : 'rgba(255,255,255,0.02)',
                    opacity: (i + 1) * 10 <= progress ? 1 : 0.5,
                    boxShadow: (i + 1) * 10 <= progress ? `0 0 10px ${color}44` : 'none',
                }}>
                    {(i + 1) * 10 <= progress && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    )}
                </div>
              ))}
           </div>
           <div className="flex justify-between items-end mono">
              <div>
                  <div className="text-[9px] text-dim">CURRENT_TIER</div>
                  <div className="text-sm font-bold">LVL {Math.floor(progress / 10)}</div>
              </div>
              <div className="text-right">
                  <div className="text-[18px] font-black italic">{Math.round(progress)}%</div>
              </div>
           </div>
        </div>
      )

    case 'ROAD':
      return (
        <div className="py-6 px-2">
           <div className="relative h-px bg-white/10">
              <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-white/20" />
              <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-white/20" />
              
              <div className="absolute inset-y-0 left-0 bg-accent-bright h-full shadow-[0_0_10px_var(--accent-bright)]" style={{ width: `${progress}%` }} />
              
              <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ left: `${progress}%` }}>
                 <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent-bright text-black px-1.5 py-0.5 rounded text-[8px] font-black mono whitespace-nowrap">
                        WAYPOINT
                    </div>
                    <div className="w-4 h-4 rounded-full bg-black border-2 border-accent-bright flex items-center justify-center -translate-x-1/2">
                        <div className="w-1 h-1 bg-accent-bright rounded-full animate-ping" />
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex justify-between mt-6 mono text-[9px] text-dim">
              <span>{goal.currentValue} ORIGIN</span>
              <span>{goal.targetValue} TARGET</span>
           </div>
        </div>
      )

    case 'SPARKLINE':
      return (
        <div className="py-2">
           <div className="h-16 w-full mb-4 relative overflow-hidden bg-white/[0.02] rounded border border-white/5">
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path 
                  d="M0 35 Q 25 38 50 30 T 100 5" 
                  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2,2" 
                />
                <path 
                  d={`M0 35 Q 25 38 50 ${35 - (progress/100)*15} T 100 ${Math.max(2, 40 - (progress/100)*35)}`} 
                  fill="none" stroke={color} strokeWidth="2.5" 
                  style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                />
              </svg>
           </div>
           <div className="flex items-center justify-between">
              <div>
                 <div className="text-3xl font-black tracking-tight">{goal.currentValue}</div>
                 <div className="text-[9px] text-dim mono uppercase">Real_Time_Trend</div>
              </div>
              <div className="text-right p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                 <div className="text-green-500 text-xs font-bold">▲ {progress.toFixed(1)}%</div>
                 <div className="text-[8px] text-green-500/60 mono uppercase">Growth</div>
              </div>
           </div>
        </div>
      )

    default: // CLASSIC
      return (
        <div className="py-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-dim mono font-bold">OBJECTIVE_PROGRESS</span>
            <span className="text-lg font-black mono" style={{ color: color }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <div 
                className="h-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)" 
                style={{ width: `${progress}%`, background: color, boxShadow: `0 0 10px ${color}66` }} 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ width: '50px' }} />
          </div>
          <div className="flex justify-between mt-3 px-1">
             <div className="flex flex-col">
                 <span className="text-[8px] text-dim mono">CURRENT_SCALE</span>
                 <span className="text-[11px] font-bold">{goal.currentValue.toLocaleString()}</span>
             </div>
             <div className="flex flex-col text-right">
                 <span className="text-[8px] text-dim mono">STRATEGIC_TARGET</span>
                 <span className="text-[11px] font-bold">{goal.targetValue.toLocaleString()}</span>
             </div>
          </div>
        </div>
      )
  }
}
