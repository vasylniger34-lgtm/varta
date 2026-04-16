'use client'

import React, { useState, useEffect } from 'react'
import { Volume2, Sliders, Moon, Wifi, Shield, LogOut } from 'lucide-react'

export default function MobileSettingsView() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [pitch, setPitch] = useState(1)
  const [rate, setRate] = useState(1)

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
    }
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const testVoice = () => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('Система Варта готова до роботи. Рівень доступу — адміністратор.')
    utterance.lang = 'uk-UA'
    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) utterance.voice = voice
    utterance.pitch = pitch
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="mobile-settings-view">
      <div className="settings-section">
        <h3 className="section-title mono"><Volume2 size={12} /> COALESCE_VOICE</h3>
        
        <div className="setting-control">
          <label className="mono text-xs text-dim">SELECT_VOICE</label>
          <select 
            value={selectedVoice} 
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="settings-select"
          >
            {voices.filter(v => v.lang.startsWith('uk') || v.lang.startsWith('en')).map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </div>

        <div className="setting-control">
          <div className="flex justify-between mono text-xs text-dim">
            <span>PITCH</span>
            <span>{pitch}</span>
          </div>
          <input 
            type="range" min="0.5" max="2" step="0.1" 
            value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="settings-range"
          />
        </div>

        <div className="setting-control">
          <div className="flex justify-between mono text-xs text-dim">
            <span>BITRATE_SPEED</span>
            <span>{rate}</span>
          </div>
          <input 
            type="range" min="0.5" max="2" step="0.1" 
            value={rate} onChange={(e) => setRate(parseFloat(e.target.value))}
            className="settings-range"
          />
        </div>

        <button onClick={testVoice} className="test-voice-btn mono">RUN_DIAGNOSTIC_VOICE</button>
      </div>

      <div className="settings-section">
        <h3 className="section-title mono"><Shield size={12} /> SECURITY_PROTOCOLS</h3>
        <div className="setting-item">
          <span>BIOMETRIC_LOCK</span>
          <div className="toggle-mini active"></div>
        </div>
        <div className="setting-item">
          <span>ENCRYPTED_COMMS</span>
          <div className="toggle-mini active"></div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title mono"><Wifi size={12} /> NETWORK_LINK</h3>
        <div className="setting-item">
          <span>REMOTE_PC_BRIDGE</span>
          <span className="text-accent mono text-xs">CONNECTED</span>
        </div>
      </div>

      <button className="logout-btn mono">
        <LogOut size={16} /> TERMINATE_SESSION
      </button>

      <style jsx>{`
        .mobile-settings-view {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-title {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--text-dim);
          border-bottom: 1px solid var(--border-default);
          padding-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .setting-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .settings-select {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 12px;
          font-size: 12px;
          font-family: var(--font-mono);
          outline: none;
        }
        .settings-range {
          width: 100%;
          accent-color: var(--accent-bright);
        }
        .test-voice-btn {
          width: 100%;
          padding: 12px;
          background: rgba(139, 0, 0, 0.1);
          border: 1px solid var(--accent-dark);
          color: var(--accent-bright);
          font-size: 10px;
          letter-spacing: 0.1em;
          margin-top: 8px;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .toggle-mini {
          width: 32px;
          height: 16px;
          background: var(--bg-elevated);
          border-radius: 8px;
          position: relative;
        }
        .toggle-mini.active::after {
          content: '';
          position: absolute;
          right: 2px;
          top: 2px;
          width: 12px;
          height: 12px;
          background: var(--accent-bright);
          border-radius: 50%;
        }
        .logout-btn {
          margin-top: 20px;
          width: 100%;
          padding: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--error);
          color: var(--error);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 12px;
          letter-spacing: 0.1em;
        }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
      `}</style>
    </div>
  )
}
