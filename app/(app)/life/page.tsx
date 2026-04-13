'use client'

import { useState, useEffect } from 'react'

type Task = {
  id: string
  title: string
  period: 'day' | 'week' | 'month'
  done: boolean
  children?: Task[]
}

export default function LifePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?period=day') // will be enhanced later to fetch all or via tabs
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (title: string, period: 'day' | 'week' | 'month') => {
    if (!title.trim()) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, period }),
    })
    if (res.ok) fetchTasks()
  }

  const handleToggleTask = async (id: string, done: boolean) => {
    // optimistic UI
    setTasks(prev => updateTaskInTree(prev, id, { done }))
    
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    })
  }

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => removeTaskFromTree(prev, id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  const updateTaskInTree = (taskList: Task[], id: string, props: Partial<Task>): Task[] => {
    return taskList.map(t => {
      if (t.id === id) return { ...t, ...props }
      if (t.children) return { ...t, children: updateTaskInTree(t.children, id, props) }
      return t
    })
  }

  const removeTaskFromTree = (taskList: Task[], id: string): Task[] => {
    return taskList.filter(t => t.id !== id).map(t => {
      if (t.children) return { ...t, children: removeTaskFromTree(t.children, id) }
      return t
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-label">MODULE_LIFE // OPERATIONAL</div>
        <h1 className="page-title">LIFE MANAGEMENT AREA</h1>
        <div className="page-desc">Tactical timeline control & active operations tracking.</div>
      </div>

      {loading ? (
           <div className="text-dim">SYNCING MODULE...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          <TaskColumn 
            title="DAY / TACTICAL" 
            period="day" 
            tasks={tasks.filter(t => t.period === 'day')} 
            onAdd={t => handleAddTask(t, 'day')}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn 
            title="WEEK / STRATEGIC" 
            period="week" 
            tasks={tasks.filter(t => t.period === 'week')} 
            onAdd={t => handleAddTask(t, 'week')}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
          <TaskColumn 
            title="MONTH / GLOBAL" 
            period="month" 
            tasks={tasks.filter(t => t.period === 'month')} 
            onAdd={t => handleAddTask(t, 'month')}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
        </div>
      )}
    </div>
  )
}

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
