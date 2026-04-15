'use client'

import { useState, useEffect } from 'react'
import { Target, TrendingUp, Edit3, DollarSign, Check } from 'lucide-react'
import { useEvents } from '@/context/EventContext'

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

  if (loading) return <div className="text-dim text-xs p-4 animate-pulse">SYNCING STRATEGIC_TARGETS...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {goals.length === 0 && (
        <div className="text-dim text-xs text-center py-8">NO ACTIVE GOALS</div>
      )}
      
      {goals.map(goal => {
        const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        const radius = 35
        const circumference = 2 * Math.PI * radius
        const offset = circumference - (progress / 100) * circumference

        return (
          <div key={goal.id} className="panel" style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={14} className="text-accent" />
                <span className="text-sm font-bold uppercase mono">{goal.title}</span>
              </div>
              <button 
                onClick={() => setEditingId(editingId === goal.id ? null : goal.id)}
                className="text-dim hover:text-primary"
              >
                <Edit3 size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Circular Progress */}
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="transparent"
                    stroke="var(--bg-base)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="transparent"
                    stroke="var(--accent-bright)"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ 
                        transition: 'stroke-dashoffset 0.5s ease',
                        filter: 'drop-shadow(0 0 3px var(--accent-bright))'
                    }}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700
                }}>
                  {Math.round(progress)}%
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="text-xs text-dim uppercase mb-1">Current Progress</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {goal.type === 'money' && '$'}{goal.currentValue} 
                  <span className="text-dim text-xs ml-1">/ {goal.targetValue}</span>
                </div>
                
                {editingId === goal.id && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input 
                      type="number"
                      className="input-field"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
