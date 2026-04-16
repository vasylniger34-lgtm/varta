'use client'

import { useState, useEffect, useMemo } from 'react'
import { Target, TrendingUp, Edit3, DollarSign, Check, ChevronRight, ChevronLeft, Zap, Thermometer, Hash, Activity } from 'lucide-react'
import { useEvents } from '@/context/EventContext'

const STYLES = ['CLASSIC', 'CIRCLE', 'THERMOMETER', 'DIGITAL', 'HUD', 'SEGMENTS', 'ROAD', 'SPARKLINE']

export default function GoalWidget() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    const currentIndex = STYLES.indexOf(goal.style || 'CLASSIC')
    const nextIndex = (currentIndex + 1) % STYLES.length
    const nextStyle = STYLES[nextIndex]
    
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, style: nextStyle } : g))
    
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, style: nextStyle })
    })
  }

  if (loading) return <div className="text-dim text-xs p-4 animate-pulse">SYNCING STRATEGIC_TARGETS...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {goals.length === 0 && (
        <div className="text-dim text-xs text-center py-8">NO ACTIVE GOALS</div>
      )}
      
      {goals.map(goal => {
        const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        const style = goal.style || 'CLASSIC'

        return (
          <div key={goal.id} className="goal-container animate-fade-in" style={{ 
              position: 'relative',
              padding: '16px', 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={14} className="text-accent" />
                <span className="text-xs font-bold uppercase mono letter-spacing-1">{goal.title}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => cycleStyle(goal)} className="text-dim hover:text-accent-bright" title="Switch View Mode">
                    <Activity size={12} />
                 </button>
                 <button onClick={() => setEditingId(editingId === goal.id ? null : goal.id)} className="text-dim hover:text-primary">
                    <Edit3 size={12} />
                 </button>
              </div>
            </div>

            {/* Content based on Style */}
            <div className="goal-content">
               {renderGoalStyle(style, goal, progress)}
            </div>

            {/* Quick Edit Footer */}
            {editingId === goal.id && (
                <div className="animate-slide-up" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '8px' }}>
                    <input 
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                      defaultValue={goal.currentValue}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdate(goal.id, parseFloat((e.target as HTMLInputElement).value))
                          setEditingId(null)
                        }
                      }}
                    />
                    <button className="btn btn-primary" style={{ padding: '4px 8px' }}>
                       <Check size={14} />
                    </button>
                </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderGoalStyle(style: string, goal: any, progress: number) {
  switch (style) {
    case 'CIRCLE':
      const radius = 35
      const circumference = 2 * Math.PI * radius
      const offset = circumference - (progress / 100) * circumference
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r={radius} fill="transparent" stroke="var(--accent-bright)" strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'drop-shadow(0 0 4px var(--accent-bright))' }}
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div 
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}
              className="mono"
            >
              {Math.round(progress)}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-huge" style={{ fontSize: '18px', fontWeight: 800 }}>{goal.currentValue.toLocaleString()}</div>
            <div className="text-dim text-xs">TARGET: {goal.targetValue.toLocaleString()}</div>
          </div>
        </div>
      )

    case 'THERMOMETER':
      return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ 
              width: '24px', height: '120px', background: 'var(--bg-base)', borderRadius: '12px', 
              position: 'relative', padding: '4px', border: '1px solid var(--border-default)' 
          }}>
            <div style={{ 
                position: 'absolute', bottom: '4px', left: '4px', right: '4px', 
                height: `${progress}%`, background: 'linear-gradient(to top, var(--accent-dark), var(--accent-bright))', 
                borderRadius: '8px', transition: 'height 1s ease-out',
                boxShadow: '0 0 10px var(--accent-glow)'
            }} />
          </div>
          <div style={{ flex: 1, paddingBottom: '4px' }}>
             <div className="text-xs text-dim mb-1">ACCUMULATION_INDEX</div>
             <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-bright)' }}>{progress.toFixed(1)}%</div>
             <div className="text-sm">{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}</div>
          </div>
        </div>
      )

    case 'DIGITAL':
      return (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
           <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent-bright)', textShadow: '0 0 15px var(--accent-glow)' }}>
              {goal.currentValue.toLocaleString()}
           </div>
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <span className="text-dim text-xs">GOAL: {goal.targetValue.toLocaleString()}</span>
              <div style={{ height: '1px', flex: 1, background: 'var(--border-default)' }} />
              <span className="text-accent text-xs font-bold">REMAINING: {(goal.targetValue - goal.currentValue).toLocaleString()}</span>
           </div>
        </div>
      )

    case 'HUD':
      return (
        <div className="mono" style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
              <span className="text-dim">STATUS:</span>
              <span className="text-accent-bright">{progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS'}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-dim">SYNC:</span>
              <span>{progress.toFixed(2)}%</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '4px', color: 'var(--accent-bright)' }}>
              <span>FUNDS:</span>
              <span style={{ fontWeight: 800 }}>₴{goal.currentValue.toLocaleString()}</span>
           </div>
           <div className="hud-bar" style={{ height: '4px', background: 'rgba(255,255,255,0.05)', marginTop: '4px', position: 'relative' }}>
              <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: 'var(--accent-bright)', transition: 'width 1s ease' }} />
              <div style={{ position: 'absolute', height: '100%', width: '2px', left: `${progress}%`, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 0 10px #fff' }} />
           </div>
        </div>
      )

    case 'SEGMENTS':
      const segments = Array.from({ length: 10 })
      return (
        <div>
           <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {segments.map((_, i) => (
                <div key={i} style={{ 
                    flex: 1, height: '12px', 
                    background: (i + 1) * 10 <= progress ? 'var(--accent-bright)' : 'rgba(255,255,255,0.05)',
                    boxShadow: (i + 1) * 10 <= progress ? '0 0 5px var(--accent-glow)' : 'none',
                    transition: `background 0.3s ease ${i * 0.05}s`
                }} />
              ))}
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span className="text-dim">SEGMENTED_PROGRESS</span>
              <span className="mono">{Math.round(progress)}%</span>
           </div>
        </div>
      )

    case 'ROAD':
      return (
        <div style={{ padding: '20px 0 10px' }}>
           <div style={{ position: 'relative', height: '2px', background: 'var(--border-default)', margin: '0 10px' }}>
              <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: 'var(--accent-bright)' }} />
              <div style={{ 
                  position: 'absolute', top: '50%', left: `${progress}%`, 
                  width: '12px', height: '12px', background: 'var(--accent-bright)', 
                  borderRadius: '50%', transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 15px var(--accent-bright)',
                  transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800 }}>YOU</div>
              </div>
              <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-bright)' }}>
                 <Zap size={10} fill="currentColor" />
              </div>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '10px' }} className="mono text-dim">
              <span>START_POINT</span>
              <span>DESTINATION: {goal.targetValue}</span>
           </div>
        </div>
      )

    case 'SPARKLINE':
      return (
        <div>
           <div style={{ height: '60px', width: '100%', marginBottom: '12px', position: 'relative' }}>
              {/* Fake Sparkline Path */}
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path 
                  d="M0 35 L 20 30 L 40 32 L 60 25 L 80 28 L 100 5" 
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" 
                />
                <path 
                  d={`M0 35 L 20 30 L 40 32 L 60 25 L 80 28 L 100 ${Math.max(0, 40 - (progress/100)*40)}`} 
                  fill="none" stroke="var(--accent-bright)" strokeWidth="2" 
                  style={{ filter: 'drop-shadow(0 0 2px var(--accent-bright))' }}
                />
              </svg>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                 <div className="text-huge" style={{ fontSize: '20px', fontWeight: 900 }}>{goal.currentValue}</div>
                 <div className="text-dim text-xs uppercase letter-spacing-1">Current_Scale</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ color: 'var(--accent-bright)', fontSize: '14px', fontWeight: 800 }}>+{progress.toFixed(1)}%</div>
                 <div className="text-dim text-xs uppercase">Efficiency</div>
              </div>
           </div>
        </div>
      )

    default: // CLASSIC
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <span className="text-dim">PROGRESS</span>
            <span className="mono font-bold">{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ 
                height: '100%', width: `${progress}%`, background: 'var(--accent-bright)', 
                boxShadow: '0 0 8px var(--accent-glow)', transition: 'width 1s ease-out' 
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
             <div className="text-xs text-dim">{goal.currentValue} UNITS</div>
             <div className="text-xs text-dim">{goal.targetValue} TARGET</div>
          </div>
        </div>
      )
  }
}
