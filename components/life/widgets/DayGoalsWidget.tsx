'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, Zap } from 'lucide-react'

export default function DayGoalsWidget() {
  const [day, setDay] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchDayData()
  }, [])

  const fetchDayData = async () => {
    try {
      const res = await fetch('/api/daily')
      const data = await res.json()
      
      if (data.needsReset) {
        handleReset()
      } else {
        setDay(data.today)
        setStreak(data.streak)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    // Small delay for animation feel
    setTimeout(async () => {
      try {
        const res = await fetch('/api/daily', { method: 'POST' })
        const data = await res.json()
        setDay(data.today)
        setStreak(data.streak)
      } catch (e) {
        console.error(e)
      } finally {
        setIsResetting(false)
      }
    }, 1000)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !day) return

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTitle, 
        period: 'day',
        dayId: day.id 
      }),
    })
    
    if (res.ok) {
        setNewTitle('')
        fetchDayData() // Refresh stats
    }
  }

  const handleToggle = async (taskId: string, done: boolean) => {
    // Optimistic update
    setDay((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, done } : t)
    }))

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    })
    
    fetchDayData() // Refresh stats (total/completed) in background
  }

  const handleDelete = async (taskId: string) => {
    setDay((prev: any) => ({
      ...prev,
      tasks: prev.tasks.filter((t: any) => t.id !== taskId)
    }))

    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    fetchDayData()
  }

  if (loading) return <div className="text-dim text-xs animate-pulse">CONNECTING TO DAY_LOG...</div>

  const progress = day?.totalTasks > 0 ? (day.completedTasks / day.totalTasks) * 100 : 0

  return (
    <div className={`day-goals-root ${isResetting ? 'resetting' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%' }}>
      
      {/* XP & Streak Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2px' }}>
        <div>
          <div className="text-xs text-secondary uppercase letter-spacing">Current Streak</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-bright)', fontWeight: 700 }}>
            <Zap size={14} fill="currentColor" />
            <span>{streak?.current || 0} DAYS</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div className="text-xs text-secondary uppercase letter-spacing">Daily Progress</div>
           <div className="text-sm mono">{day?.completedTasks || 0} / {day?.totalTasks || 0} XP</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'relative', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ 
            position: 'absolute', 
            height: '100%', 
            width: `${progress}%`, 
            background: 'var(--accent-bright)', 
            boxShadow: '0 0 10px var(--accent-glow-strong)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      <div className="divider" style={{ margin: 'var(--space-2) 0' }} />

      {/* Task List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {day?.tasks.map((task: any) => (
          <div key={task.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '8px',
            background: task.done ? 'transparent' : 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--border-radius)',
            opacity: task.done ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}>
            <button onClick={() => handleToggle(task.id, !task.done)} style={{ color: task.done ? 'var(--accent-bright)' : 'var(--text-dim)' }}>
              {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            <span style={{ 
               flex: 1, 
               fontSize: '13px', 
               textDecoration: task.done ? 'line-through' : 'none' 
            }}>
              {task.title}
            </span>
            <button onClick={() => handleDelete(task.id)} className="text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: '2px' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {day?.tasks.length === 0 && (
          <div className="text-dim text-xs text-center py-8 uppercase letter-spacing">
            No missions for today.
          </div>
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="New goal..." 
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ fontSize: '13px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
          <Plus size={18} />
        </button>
      </form>

      <style jsx>{`
        .day-goals-root {
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }
        .resetting {
          transform: translateY(-20px);
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
