'use client'

import { useState, useEffect, useRef } from 'react'

interface NotesWidgetProps {
  widgetId: string
  initialData?: any
}

export default function NotesWidget({ widgetId, initialData }: NotesWidgetProps) {
  const [content, setContent] = useState(initialData?.content || '')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleUpdate = (newContent: string) => {
    setContent(newContent)

    // Debounced save
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      await fetch('/api/widgets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: widgetId, 
          data: { content: newContent } 
        })
      })
    }, 1000)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <textarea
        className="mono"
        placeholder="Type something here..."
        value={content}
        onChange={(e) => handleUpdate(e.target.value)}
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '13px',
          resize: 'none',
          lineHeight: '1.6',
          fontFamily: 'var(--font-mono)'
        }}
      />
      <div style={{ 
          fontSize: '10px', 
          color: 'var(--text-dim)', 
          textAlign: 'right', 
          paddingTop: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
      }}>
        Auto-saving...
      </div>
    </div>
  )
}
