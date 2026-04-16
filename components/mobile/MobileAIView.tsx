'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Command, Sparkles, Send, Play, RotateCcw } from 'lucide-react'

const QUICK_COMMANDS = [
  { label: 'ДОДАЙ ЗАДАЧУ', cmd: 'Варта, додай задачу ' },
  { label: 'МІЙ STREAK', cmd: 'Варта, скільки в мене streak?' },
  { label: 'ЦІЛЬ +500', cmd: 'Варта, додай 500 до цілі' },
  { label: 'ВІДКРИЙ ПК', cmd: 'Варта, відкрий ПК режим' },
]

export default function MobileAIView() {
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING'>('IDLE')
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const recognitionRef = useRef<any>(null)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)

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
          const text = event.results[0][0].transcript
          setTranscript(text)
          processCommand(text)
        }

        recognitionRef.current.onend = () => {
          if (status === 'LISTENING') setStatus('IDLE')
        }

        recognitionRef.current.onerror = () => {
          setStatus('IDLE')
        }
      }
    }
  }, [status])

  const toggleListening = () => {
    if (status === 'LISTENING') {
      recognitionRef.current?.stop()
      setStatus('IDLE')
    } else {
      setTranscript('')
      setAiResponse('')
      recognitionRef.current?.start()
      setStatus('LISTENING')
    }
  }

  const speak = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'uk-UA'
    utterance.onstart = () => setStatus('RESPONDING')
    utterance.onend = () => setStatus('IDLE')
    window.speechSynthesis.speak(utterance)
  }

  const processCommand = async (text: string) => {
    setStatus('THINKING')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [] }),
      })
      const data = await res.json()
      
      if (data.response) {
        setAiResponse(data.response)
        speak(data.response)
        
        // Handle local execution if needed
        if (data.intent && data.intent !== 'chat') {
            await fetch('http://localhost:3005/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'mobile', intent: data.intent, payload: data.payload }),
              }).catch(() => console.warn('Local PC unreachable'))
        }
      } else {
        setStatus('IDLE')
      }
    } catch (e) {
      console.error(e)
      setStatus('IDLE')
    }
  }

  return (
    <div className="varta-orb-container">
      <div className="ai-status-indicator">
        <Sparkles size={12} className={status !== 'IDLE' ? 'animate-pulse' : ''} />
        <span>VARTA_CORE // {status}</span>
      </div>

      <div className={`varta-orb ${status.toLowerCase()}`} onClick={toggleListening}>
        <div className="orb-ring" />
        <div className="orb-ring" style={{ animationDelay: '-2s', opacity: 0.5 }} />
        <div className="orb-core" />
        
        <div className="orb-label">
          {status === 'LISTENING' ? <Mic size={32} /> : status === 'IDLE' ? <Command size={32} /> : null}
        </div>
      </div>

      <div className="ai-transcript-area">
        {transcript && <div className="transcript-user">{transcript}</div>}
        {aiResponse && <div className="transcript-ai">{aiResponse}</div>}
      </div>

      <div className="quick-commands-grid">
        {QUICK_COMMANDS.map((q) => (
          <button 
            key={q.label} 
            className="quick-cmd-btn"
            onClick={() => {
                setTranscript(q.cmd)
                processCommand(q.cmd)
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .ai-status-indicator {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--accent-bright);
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
        }
        .orb-label {
          position: absolute;
          color: white;
          opacity: 0.8;
          pointer-events: none;
        }
        .ai-transcript-area {
          min-height: 100px;
          padding: 0 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .transcript-user {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .transcript-ai {
          font-size: 16px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .quick-commands-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
          padding: 20px;
        }
        .quick-cmd-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-default);
          padding: 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          text-transform: uppercase;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .quick-cmd-btn:active {
          background: var(--accent-glow);
          border-color: var(--accent-mid);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}
