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
    <div className="flex flex-col h-full bg-black/40 p-5 space-y-6 font-mono select-none border border-white/5 rounded-xl">
      
      {/* Header & Progress */}
      <div className="space-y-4">
         <div className="flex justify-between items-start group">
            <div className="flex-1">
              {isEditingTitle ? (
                <input 
                  className="bg-transparent border-b-2 border-accent-bright text-accent-bright outline-none w-full text-xl font-black"
                  value={title}
                  onChange={e => setTitle(e.target.value.toUpperCase())}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                />
              ) : (
                <div 
                  className="text-2xl font-black tracking-tighter text-white flex items-center gap-3 cursor-pointer hover:text-accent-bright transition-all group/title"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <div className="p-2 rounded-lg bg-accent-bright/10 border border-accent-bright/20">
                    <Target size={20} className="text-accent-bright" />
                  </div>
                  <span>{title}</span>
                  <Edit3 size={14} className="opacity-0 group-hover/title:opacity-100 text-dim" />
                </div>
              )}
            </div>
            <div className="text-3xl font-black italic text-accent-bright drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">{progress}%</div>
         </div>

         {/* Cyber Progress Bar */}
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 flex p-0.5 relative">
            <div 
              className="h-full bg-accent-bright transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
              style={{ width: `${progress}%`, boxShadow: `0 0 20px var(--accent-bright)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
         </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {tasks.map(task => (
           <div 
             key={task.id} 
             onClick={() => toggleTask(task.id)}
             className={`flex flex-row items-center gap-5 p-4 rounded-xl border transition-all duration-300 cursor-pointer group
               ${task.done 
                 ? 'bg-black/40 border-white/5' 
                 : 'bg-white/[0.04] border-white/10 hover:border-accent-bright/50 hover:bg-white/[0.08] shadow-2xl'
               }`}
           >
              {/* Checkbox on the LEFT */}
              <div 
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-500
                  ${task.done 
                    ? 'bg-accent-bright border-accent-bright text-black shadow-[0_0_15px_var(--accent-bright)]' 
                    : 'border-white/30 text-transparent group-hover:border-accent-bright'
                  }`}
              >
                {task.done && <CheckSquare size={20} strokeWidth={3} />}
              </div>
              
              {/* Larger Text with Strike-through */}
              <span className={`text-lg font-bold flex-1 transition-all duration-500 ${task.done ? 'line-through text-dim opacity-40' : 'text-white'}`}>
                {task.text}
              </span>

              <button 
                onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg text-dim hover:text-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
           </div>
        ))}

        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-16 border-2 border-dashed border-white/5 rounded-xl">
             <div className="text-[10px] mono uppercase tracking-[0.2em] font-bold">MISSING_OBJECTIVES_IN_PLAN</div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="pt-4 border-t border-white/5">
        <form onSubmit={addTask} className="relative">
           <input 
             className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-3 px-4 text-xs text-white outline-none focus:border-accent-bright focus:bg-white/[0.06] transition-all placeholder:text-dim/50 font-bold"
             placeholder="ENTER NEW CHECKPOINT..."
             value={newTaskText}
             onChange={e => setNewTaskText(e.target.value)}
           />
           <button 
             type="submit"
             className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-accent-bright rounded-md text-black hover:scale-110 transition-transform active:scale-95"
           >
             <ChevronRight size={18} strokeWidth={3} />
           </button>
        </form>
      </div>
    </div>
  )
}
