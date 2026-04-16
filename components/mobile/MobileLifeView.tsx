'use client'

import React, { useState, useEffect } from 'react'
import { Target, Zap, CheckCircle2, Circle, AlertCircle, RefreshCw } from 'lucide-react'
import DraggableBoard from '../life/DraggableBoard'

export default function MobileLifeView() {
  const [isLandscape, setIsLandscape] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    fetchData()

    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/daily')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (taskId: string, currentDone: boolean) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, done: !currentDone }),
      })
      fetchData() // Refresh
    } catch (e) {
      console.error(e)
    }
  }

  if (isLandscape) {
    return (
      <div className="mobile-landscape-board">
        <DraggableBoard />
        <style jsx>{`
          .mobile-landscape-board {
            width: 100vw;
            height: 100vh;
            background: var(--bg-base);
            padding: 10px;
            overflow: auto;
          }
        `}</style>
      </div>
    )
  }

  if (loading) return <div className="p-10 text-center text-dim mono text-xs animate-pulse">RECALLING_MISSION_DATA...</div>

  const today = data?.today
  const streak = data?.streak

  return (
    <div className="mobile-portrait-life">
      <div className="life-header">
        <h2 className="mono uppercase tracking-widest text-accent">Module_Life // Board</h2>
        <button onClick={fetchData} className="text-dim"><RefreshCw size={14} /></button>
      </div>

      {/* Streak Card */}
      <div className="dashboard-card streak-card">
        <div className="card-header">
          <span className="card-title">Stellar_Streak</span>
          <Zap size={14} className="text-accent" />
        </div>
        <div className="streak-value">
          <span className="streak-num">{streak?.current || 0}</span>
          <span className="streak-label">DAYS_ACTIVE</span>
        </div>
        <div className="streak-best mono">BEST: {streak?.best || 0}</div>
      </div>

      {/* Progress Card */}
      <div className="dashboard-card progress-card">
        <div className="card-header">
          <span className="card-title">Neural_Completion</span>
          <span className="text-accent">{today?.completionPercentage || 0}%</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${today?.completionPercentage || 0}%` }} 
          />
        </div>
        <div className="progress-meta mono">
          {today?.completedTasks || 0} / {today?.totalTasks || 0} MISSIONS_DONE
        </div>
      </div>

      {/* Tasks Card */}
      <div className="dashboard-card tasks-card">
        <div className="card-header">
          <span className="card-title">Daily_Objectives</span>
          <Target size={14} className="text-dim" />
        </div>
        <div className="mobile-task-list">
          {today?.tasks?.map((task: any) => (
            <div 
                key={task.id} 
                className={`mobile-task-item ${task.done ? 'done' : ''}`}
                onClick={() => toggleTask(task.id, task.done)}
            >
              {task.done ? <CheckCircle2 size={18} className="text-accent" /> : <Circle size={18} className="text-dim" />}
              <span className="task-text">{task.title}</span>
            </div>
          ))}
          {(!today?.tasks || today.tasks.length === 0) && (
            <div className="text-dim text-xs py-4 text-center">NO_ACTIVE_MISSIONS</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mobile-portrait-life {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .life-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .streak-num {
          font-size: 48px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .streak-label {
          font-size: 10px;
          color: var(--text-dim);
          margin-left: 8px;
          letter-spacing: 0.1em;
        }
        .streak-best {
          font-size: 9px;
          color: var(--text-dim);
          margin-top: 8px;
        }
        .progress-bar-bg {
          height: 6px;
          background: var(--bg-elevated);
          border-radius: 3px;
          margin: 12px 0;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent-bright);
          box-shadow: 0 0 10px var(--accent-glow);
          transition: width 0.5s ease-out;
        }
        .progress-meta {
          font-size: 9px;
          color: var(--text-dim);
        }
        .mobile-task-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mobile-task-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .mobile-task-item:last-child {
          border-bottom: none;
        }
        .mobile-task-item.done .task-text {
          color: var(--text-dim);
          text-decoration: line-through;
        }
        .task-text {
          font-size: 14px;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}
