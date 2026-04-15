'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { GripVertical, X, Maximize2 } from 'lucide-react'
import { useEvents } from '@/context/EventContext'
import { WIDGET_REGISTRY } from '@/lib/widget-registry'

interface WidgetFrameProps {
  id: string
  type: string
  title: string
  posX: number
  posY: number
  w: number
  h: number
  children: ReactNode
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, w: number, h: number) => void
  onDelete?: (id: string) => void
  isActive?: boolean
  onClick?: () => void
}

export default function WidgetFrame({ 
  id, 
  type, 
  title, 
  posX, 
  posY, 
  w, 
  h, 
  children, 
  onMove, 
  onResize,
  onDelete,
  isActive,
  onClick
}: WidgetFrameProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x: posX, y: posY })
  const [size, setSize] = useState({ w, h })
  
  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ w: 0, h: 0, x: 0, y: 0 })
  const frameRef = useRef<HTMLDivElement>(null)
  
  const { emitEvent } = useEvents()
  const config = WIDGET_REGISTRY[type] || { minW: 200, minH: 150 }

  useEffect(() => {
    setPosition({ x: posX, y: posY })
  }, [posX, posY])

  useEffect(() => {
    setSize({ w, h })
  }, [w, h])

  // DRAG LOGIC
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.stopPropagation()
      onClick?.()
    }
  }

  // RESIZE LOGIC
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    resizeStart.current = {
      w: size.w,
      h: size.h,
      x: e.clientX,
      y: e.clientY
    }
    e.stopPropagation()
    e.preventDefault()
    onClick?.()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.current.x
        const newY = e.clientY - dragStart.current.y
        setPosition({ x: newX, y: newY })
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        
        const newW = Math.max(config.minW, resizeStart.current.w + deltaX)
        const newH = Math.max(config.minH, resizeStart.current.h + deltaY)
        
        setSize({ w: newW, h: newH })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        onMove(id, position.x, position.y)
        emitEvent('WIDGET_MOVED', { id, type, x: position.x, y: position.y })
      }
      if (isResizing) {
        setIsResizing(false)
        onResize(id, size.w, size.h)
        emitEvent('WIDGET_RESIZED', { id, type, w: size.w, h: size.h })
      }
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, id, type, onMove, onResize, position, size, config, emitEvent])

  return (
    <div
      ref={frameRef}
      onMouseDown={onClick}
      className={`panel varta-widget ${isDragging ? 'dragging' : ''} ${isActive ? 'active' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.w,
        height: size.h,
        zIndex: isDragging || isResizing ? 1000 : (isActive ? 50 : 10),
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div 
        className="panel-header drag-handle grab-handle" 
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GripVertical size={14} className="text-dim" />
          <div className="panel-title">{title}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onDelete && (
             <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="text-dim hover:text-accent">
               <X size={14} />
             </button>
          )}
        </div>
      </div>
      
      <div className="panel-body" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle" 
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}
