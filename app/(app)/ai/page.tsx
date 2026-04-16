'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, User, Send, Sparkles, Command, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

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
  const [isListening, setIsListening] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'uk-UA'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!recognitionRef.current) {
        alert('Голосове введення не підтримується цим браузером.')
        return
      }
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const speak = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return
    
    // Cancel previous speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'uk-UA'
    
    // Try to find a good Ukrainian voice
    const voices = window.speechSynthesis.getVoices()
    const ukVoice = voices.find(v => v.lang.startsWith('uk'))
    if (ukVoice) utterance.voice = ukVoice
    
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    window.speechSynthesis.speak(utterance)
  }

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
        
        // Озвучування відповіді
        if (isVoiceEnabled) {
          speak(data.response)
        }
        
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
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto' }}>
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isVoiceEnabled ? 'var(--accent-bright)' : 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isVoiceEnabled ? 'Виключити звук' : 'Включити звук'}
            >
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
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
            <button
              type="button"
              onClick={toggleListening}
              className={`mic-btn ${isListening ? 'active' : ''}`}
              style={{
                background: isListening ? 'var(--accent-glow)' : 'transparent',
                border: '1px solid',
                borderColor: isListening ? 'var(--accent-bright)' : 'var(--border-default)',
                color: isListening ? 'var(--accent-bright)' : 'var(--text-dim)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {isListening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
              {isListening && (
                <span className="mic-ripple" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '1px solid var(--accent-bright)',
                  borderRadius: '0',
                  animation: 'ripple 1.5s infinite ease-out'
                }} />
              )}
            </button>
            <input 
              type="text" 
              className="input-field" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? "LISTENING..." : "ENTER COMMAND..."} 
              disabled={loading}
              style={{ fontSize: '12px', flex: 1 }}
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
