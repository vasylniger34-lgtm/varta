'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { GripVertical, X } from 'lucide-react'

interface WidgetFrameProps {
  id: string
  title: string
  posX: number
  posY: number
  w: number
  h: number
  children: ReactNode
  onMove: (id: string, x: number, y: number) => void
  onDelete?: (id: string) => void
}

export default function WidgetFrame({ id, title, posX, posY, w, h, children, onMove, onDelete }: WidgetFrameProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: posX, y: posY })
  const dragStart = useRef({ x: 0, y: 0 })
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPosition({ x: posX, y: posY })
  }, [posX, posY])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.preventDefault()
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const newX = e.clientX - dragStart.current.x
      const newY = e.clientY - dragStart.current.y
      
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        onMove(id, position.x, position.y)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, id, onMove, position])

  return (
    <div
      ref={frameRef}
      className={`panel ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: w,
        height: h,
        zIndex: isDragging ? 1000 : 10,
        display: 'flex',
        flexDirection: 'column',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.4)' : 'none',
        opacity: isDragging ? 0.9 : 1
      }}
    >
      <div className="panel-header drag-handle" style={{ cursor: 'grab', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GripVertical size={14} className="text-dim" />
          <div className="panel-title">{title}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onDelete && (
             <button onClick={() => onDelete(id)} className="text-dim hover:text-accent">
               <X size={14} />
             </button>
          )}
        </div>
      </div>
      <div className="panel-body" style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>

      <style jsx>{`
        .drag-handle:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}
