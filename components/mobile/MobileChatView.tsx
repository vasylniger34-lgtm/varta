'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Volume2, User, Bot, Clock } from 'lucide-react'

export default function MobileChatView() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/history')
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: messages.slice(-10) }),
      })
      const data = await res.json()
      if (data.response) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }])
        speak(data.response)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const speak = (text: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'uk-UA'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="mobile-chat-view">
      <div className="chat-content">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
            <div className="bubble-icon">
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className="bubble-body">
                <div className="bubble-text">{msg.text}</div>
                {msg.role === 'model' && (
                    <button className="replay-btn" onClick={() => speak(msg.text)}>
                        <Volume2 size={12} /> <span>REPLAY</span>
                    </button>
                )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrapper model animate-pulse">
            <div className="bubble-icon"><Bot size={12} /></div>
            <div className="bubble-body">
              <div className="bubble-text text-dim mono">TRANSMITTING...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSend} className="chat-form">
          <input 
            type="text" 
            className="chat-input" 
            placeholder="TYPE_COMMAND..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .mobile-chat-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
        }
        .chat-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .chat-bubble-wrapper {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }
        .chat-bubble-wrapper.user {
          flex-direction: row-reverse;
          align-self: flex-end;
        }
        .bubble-icon {
          width: 24px;
          height: 24px;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .model .bubble-icon {
          border-color: var(--accent-mid);
          color: var(--accent-bright);
        }
        .bubble-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .user .bubble-body {
          align-items: flex-end;
        }
        .bubble-text {
          padding: 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary);
        }
        .model .bubble-text {
          background: transparent;
          border: none;
          border-left: 2px solid var(--accent-dark);
          padding-left: 12px;
          padding-top: 0;
          padding-bottom: 0;
        }
        .replay-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 700;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          margin-top: 4px;
        }
        .replay-btn:active {
          color: var(--accent-bright);
        }
        .chat-input-area {
          padding: 16px;
          background: rgba(15, 15, 15, 0.9);
          backdrop-filter: blur(10px);
          border-top: 1px solid var(--border-default);
        }
        .chat-form {
          display: flex;
          gap: 12px;
        }
        .chat-input {
          flex: 1;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--text-primary);
        }
        .chat-send-btn {
          width: 48px;
          height: 48px;
          background: var(--accent-dark);
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-send-btn:disabled {
          opacity: 0.3;
        }
      `}</style>
    </div>
  )
}
