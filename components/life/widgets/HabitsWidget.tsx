'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, CheckCircle, RefreshCw, Plus, X, Timer, Flame, Clock } from 'lucide-react'

interface Habit {
  id: string
  title: string
  duration: number
  streak: number
  lastCompleted: string | null
}

export default function HabitsWidget() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDuration, setNewDuration] = useState(15)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchHabits()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      setHabits(data.habits || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const startSession = (habit: Habit) => {
    if (confirm(`Розпочати сесію для "${habit.title}" (${habit.duration} хв)?`)) {
      setActiveSession(habit.id)
      setTimeLeft(habit.duration * 60)
      
      if (timerRef.current) clearInterval(timerRef.current)
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            completeHabit(habit.id)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const completeHabit = async (id: string) => {
    setActiveSession(null)
    const res = await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, complete: true })
    })
    
    if (res.ok) {
      const { habit } = await res.json()
      setHabits(prev => prev.map(h => h.id === id ? habit : h))
      alert('Звичку виконано! Стрік оновлено.')
    }
  }

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, duration: newDuration })
    })
    
    if (res.ok) {
        const { habit } = await res.json()
        setHabits(prev => [habit, ...prev])
        setNewTitle('')
        setShowAdd(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="text-dim text-xs p-4 animate-pulse">INIT_HABIT_MODULE...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      
      {/* Header / Add Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div className="text-xs text-dim mono">ACTIVE_HABITS: {habits.length}</div>
         <button onClick={() => setShowAdd(!showAdd)} className="btn btn-ghost" style={{ padding: '2px 8px' }}>
            {showAdd ? <X size={14} /> : <Plus size={14} />}
         </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={addHabit} className="panel animate-slide-up" style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--accent-dark)' }}>
           <input 
             className="input-field" 
             placeholder="Habit Title..." 
             value={newTitle}
             onChange={e => setNewTitle(e.target.value)}
             style={{ marginBottom: '8px', fontSize: '12px' }}
           />
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Clock size={12} className="text-dim" />
              <input 
                type="number" 
                className="input-field" 
                value={newDuration}
                onChange={e => setNewDuration(parseInt(e.target.value))}
                style={{ width: '60px', padding: '4px', fontSize: '11px' }}
              />
              <span className="text-xs text-dim">mins</span>
              <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '11px' }}>ADD</button>
           </div>
        </form>
      )}

      {/* Active Session Overlay */}
      {activeSession && (
          <div className="panel animate-pulse" style={{ background: 'var(--accent-glow)', border: '2px solid var(--accent-bright)', padding: '16px', textAlign: 'center' }}>
             <div className="text-xs uppercase mono mb-2 text-accent-bright">Session in Progress</div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', textShadow: '0 0 10px var(--accent-bright)' }}>
                {formatTime(timeLeft)}
             </div>
             <div className="text-sm mt-1">{habits.find(h => h.id === activeSession)?.title}</div>
             <button onClick={() => { if(timerRef.current) clearInterval(timerRef.current); setActiveSession(null); }} className="btn btn-ghost mt-4" style={{ color: '#ff4444' }}>ABORT</button>
          </div>
      )}

      {/* Habits List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {habits.map(habit => {
          const isCompletedToday = habit.lastCompleted && new Date(habit.lastCompleted).toDateString() === new Date().toDateString()
          
          return (
            <div key={habit.id} className="habit-item" style={{ 
                padding: '10px 12px', 
                background: isCompletedToday ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-elevated)',
                border: '1px solid',
                borderColor: isCompletedToday ? '#059669' : 'var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isCompletedToday ? '#10b981' : 'var(--text-primary)' }}>{habit.title}</span>
                  {habit.streak > 0 && (
                    <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
                       <Flame size={10} fill="#f59e0b" /> {habit.streak}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }} className="mono">
                   TIME: {habit.duration}m | {isCompletedToday ? 'STATUS: DONE_FOR_TODAY' : 'STATUS: PENDING'}
                </div>
              </div>

              {!isCompletedToday && !activeSession && (
                <button 
                  onClick={() => startSession(habit)} 
                  className="btn btn-primary" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
                >
                  <Play size={14} fill="currentColor" />
                </button>
              )}
              {isCompletedToday && (
                <div style={{ color: '#10b981' }}>
                   <CheckCircle size={20} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
