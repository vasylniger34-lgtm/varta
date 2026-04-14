'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, User, Send, Sparkles, Command } from 'lucide-react'

type Message = {
  role: 'user' | 'model'
  text: string
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'VARTA AI CORE INITIALIZED.\nAwaiting operator input.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const historyMsg = messages.filter(m => m.text !== 'VARTA AI CORE INITIALIZED.\nAwaiting operator input.')
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: historyMsg }),
      })
      const data = await res.json()
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }])
        
        // NEURAL STITCHING: Якщо інтент - це дія (не просто чат), відправляємо на локальний ПК
        if (data.intent && data.intent !== 'chat') {
          console.log(`[STITCHING] Routing action to Local PC: ${data.intent}`)
          try {
            await fetch('http://localhost:3005/api/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'web',
                intent: data.intent,
                payload: data.payload
              }),
            })
          } catch (err) {
            console.warn('[STITCHING] Local PC Agent unreachable. Is VARTA running locally?')
          }
        }
      } else {
        const errorMsg = data.details ? `[ ERR: ${data.error} — ${data.details} ]` : `[ ERR: NO RESPONSE RECIEVED FROM AI CORE ]`
        setMessages(prev => [...prev, { role: 'model', text: errorMsg }])
      }
    } catch (e: any) {
      console.error(e)
      setMessages(prev => [...prev, { role: 'model', text: '[ ERR: NETWORK FAILURE CONNECTING TO AI CORE ]' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--topbar-height) - var(--space-6) * 2)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="page-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sparkles size={12} /> MODULE_AI // CONNECTED
        </div>
        <h1 className="page-title">COGNITIVE INTERFACE</h1>
      </div>

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="panel-header">
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Command size={12} /> AI FEED
          </div>
          <div className="status-badge online">LINK STABLE</div>
        </div>
        
        <div className="panel-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 'var(--space-4)'
            }}>
              <div style={{ 
                flexShrink: 0, 
                width: '32px', 
                height: '32px', 
                border: '1px solid', 
                borderColor: msg.role === 'user' ? 'var(--text-dim)' : 'var(--accent-mid)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: msg.role === 'user' ? 'var(--text-dim)' : 'var(--accent-bright)',
                background: msg.role === 'user' ? 'transparent' : 'var(--accent-glow)'
              }}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div style={{ 
                maxWidth: '75%', 
                padding: 'var(--space-3)', 
                background: msg.role === 'user' ? 'var(--bg-elevated)' : 'transparent',
                border: msg.role === 'user' ? '1px solid var(--border-default)' : 'none',
                borderLeft: msg.role === 'model' ? '2px solid var(--accent-dark)' : 'none',
                color: msg.role === 'model' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div style={{ 
                flexShrink: 0, 
                width: '32px', 
                height: '32px', 
                border: '1px solid var(--accent-mid)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--accent-bright)',
                background: 'var(--accent-glow)'
              }}>
                <Bot size={14} className="animate-pulse" />
              </div>
              <div className="animate-pulse" style={{ padding: 'var(--space-3)', borderLeft: '2px solid var(--accent-dark)', color: 'var(--text-dim)', fontSize: '12px' }}>
                PROCESSING...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-default)', background: 'var(--bg-base)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input 
              type="text" 
              className="input-field" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="ENTER COMMAND..." 
              disabled={loading}
              style={{ fontSize: '12px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              <Send size={14} /> TRANSMIT
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
