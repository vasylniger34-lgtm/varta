'use client'

import { useState } from 'react'
import DraggableBoard from '@/components/life/DraggableBoard'
import { History, Layout, Settings } from 'lucide-react'

export default function LifePage() {
  const [view, setView] = useState<'board' | 'history'>('board')

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--topbar-height) - var(--space-6) * 2)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-label">MODULE_LIFE // OPERATIONAL</div>
            <h1 className="page-title">LIFE BOARD</h1>
            <div className="page-desc">VARTA Life OS Core — Tactical board and daily mission control.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setView('board')} 
              className={`btn ${view === 'board' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 12px' }}
            >
              <Layout size={16} />
              <span style={{ marginLeft: '8px' }}>BOARD</span>
            </button>
            <button 
              onClick={() => setView('history')} 
              className={`btn ${view === 'history' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 12px' }}
            >
              <History size={16} />
              <span style={{ marginLeft: '8px' }}>HISTORY</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {view === 'board' ? (
          <DraggableBoard />
        ) : (
          <HistoryView />
        )}
      </div>
    </div>
  )
}

function HistoryView() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history') // I need to create this API or update api/daily to support list 
      .then(res => res.json())
      .then(data => {
        setHistory(data.days || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-dim p-8">RECALLING ARCHIVES...</div>

  return (
    <div className="panel" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="panel-header">
        <div className="panel-title">MISSION LOGS / HISTORY</div>
      </div>
      <div className="panel-body">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-default)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              <th style={{ padding: '12px' }}>DATE</th>
              <th style={{ padding: '12px' }}>TASKS</th>
              <th style={{ padding: '12px' }}>XP</th>
              <th style={{ padding: '12px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {history.map(day => (
              <tr key={day.id} style={{ borderBottom: '1px solid var(--border-default)', fontSize: '13px' }}>
                <td style={{ padding: '12px' }}>{new Date(day.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{day.completedTasks} / {day.totalTasks}</td>
                <td style={{ padding: '12px' }}>
                    <div style={{ width: '100px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px' }}>
                        <div style={{ width: `${day.totalTasks > 0 ? (day.completedTasks/day.totalTasks)*100 : 0}%`, height: '100%', background: 'var(--accent-bright)' }} />
                    </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span className={`status-badge ${day.isCompleted ? 'online' : 'offline'}`}>
                    {day.isCompleted ? 'COMPLETED' : 'FAILED'}
                  </span>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>NO ARCHIVAL DATA FOUND</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useEffect } from 'react'

function TaskColumn({ 
  title, 
  period,
  tasks, 
  onAdd, 
  onToggle, 
  onDelete 
}: { 
  title: string, 
  period: 'day'|'week'|'month',
  tasks: Task[], 
  onAdd: (title: string) => void,
  onToggle: (id: string, done: boolean) => void,
  onDelete: (id: string) => void
}) {
  const [newTitle, setNewTitle] = useState('')

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{title}</div>
        <div className="status-badge online">OK</div>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={onToggle} 
            onDelete={onDelete} 
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-dim text-xs uppercase" style={{ padding: 'var(--space-2)' }}>
            NO OP_TARGETS ASSIGNED
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <form onSubmit={(e) => { e.preventDefault(); onAdd(newTitle); setNewTitle(''); }} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ padding: 'var(--space-2)', fontSize: '12px' }} 
              placeholder="ENTER TARGET..." 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px' }}>ADD</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete, depth = 0 }: { task: Task, onToggle: (id: string, done: boolean) => void, onDelete: (id: string) => void, depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = task.children && task.children.length > 0

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-3)', 
        padding: 'var(--space-2) 0',
        paddingLeft: `${depth * 16}px`,
        opacity: task.done ? 0.5 : 1,
        transition: 'opacity var(--transition-fast)'
      }}>
        
        <label className="toggle">
          <input 
            type="checkbox" 
            checked={task.done} 
            onChange={(e) => onToggle(task.id, e.target.checked)} 
          />
          <span className="toggle-slider"></span>
        </label>

        <span style={{ 
          flex: 1, 
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-mono)',
          textDecoration: task.done ? 'line-through' : 'none'
        }}>
          {task.title}
        </span>

        {hasChildren && (
          <button 
            type="button" 
            onClick={() => setExpanded(!expanded)}
            style={{ color: 'var(--text-dim)', padding: '0 4px', fontSize: '10px' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}

        <button 
          onClick={() => onDelete(task.id)}
          style={{ color: 'var(--status-offline-text)', fontSize: '10px', marginLeft: 'auto', padding: '4px' }}
        >
          [X]
        </button>

      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--border-default)', marginLeft: `${depth * 16 + 18}px`, paddingLeft: '8px' }}>
          {task.children!.map(child => (
            <TaskItem 
              key={child.id} 
              task={child} 
              onToggle={onToggle} 
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
