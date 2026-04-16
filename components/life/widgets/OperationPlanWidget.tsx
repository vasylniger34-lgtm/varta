'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, Plus, Trash2, Edit3, Target, ChevronRight } from 'lucide-react'
import { useEvents } from '@/context/EventContext'

export default function OperationPlanWidget({ widgetId, initialData }: any) {
  const [title, setTitle] = useState(initialData?.title || 'NEW_OPERATION')
  const [tasks, setTasks] = useState<any[]>(initialData?.tasks || [])
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')

  const { emitEvent } = useEvents()

  // Auto-save whenever tasks or title change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveData()
    }, 1000)
    return () => clearTimeout(timer)
  }, [tasks, title])

  const saveData = async () => {
    await fetch('/api/widgets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: widgetId,
        data: { ...initialData, title, tasks }
      })
    })
    emitEvent('WIDGET_UPDATED', { id: widgetId })
  }

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText,
      done: false
    }
    setTasks([...tasks, newTask])
    setNewTaskText('')
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full bg-black/40 p-4 space-y-4 font-mono select-none">
      
      {/* Header & Progress */}
      <div className="space-y-2">
         <div className="flex justify-between items-center group">
            {isEditingTitle ? (
              <input 
                className="bg-transparent border-b border-accent-bright text-accent-bright outline-none w-full text-sm font-bold"
                value={title}
                onChange={e => setTitle(e.target.value.toUpperCase())}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <div 
                className="text-sm font-black tracking-tighter text-white flex items-center gap-2 cursor-pointer hover:text-accent-bright transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                <Target size={14} className="text-accent-bright" />
                {title}
                <Edit3 size={10} className="opacity-0 group-hover:opacity-100" />
              </div>
            )}
            <div className="text-xl font-black italic text-accent-bright">{progress}%</div>
         </div>

         {/* Cyber Progress Bar */}
         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 flex gap-0.5 p-0.5">
            <div 
              className="h-full bg-accent-bright transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, boxShadow: `0 0 15px var(--accent-bright)` }}
            />
            {progress < 100 && (
                <div className="flex-1 bg-white/5 animate-pulse" />
            )}
         </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
        {tasks.map(task => (
           <div 
             key={task.id} 
             className={`flex items-center gap-3 p-2 rounded border border-transparent transition-all hover:bg-white/[0.03] hover:border-white/5 group ${task.done ? 'opacity-40' : ''}`}
           >
              <button 
                onClick={() => toggleTask(task.id)}
                className="text-accent-bright hover:scale-110 transition-transform"
              >
                {task.done ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className={`text-[11px] flex-1 ${task.done ? 'line-through text-dim' : 'text-white/80'}`}>
                {task.text}
              </span>
              <button 
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-dim hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
           </div>
        ))}

        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
             <Plus size={32} />
             <div className="text-[10px] mt-2">AWAITING_OBJECTIVES</div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={addTask} className="relative mt-auto">
         <input 
           className="w-full bg-white/5 border border-white/10 rounded p-2 pl-3 pr-10 text-[10px] text-white outline-none focus:border-accent-bright transition-colors"
           placeholder="ADD_CHECKPOINT..."
           value={newTaskText}
           onChange={e => setNewTaskText(e.target.value)}
         />
         <button 
           type="submit"
           className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-bright hover:text-white transition-colors"
         >
           <ChevronRight size={16} />
         </button>
      </form>
    </div>
  )
}
