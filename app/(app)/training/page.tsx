'use client'

import { useState, useEffect } from 'react'

const DEFAULT_API = 'http://127.0.0.1:3005/api'

export default function TrainingPage() {
  const [rules, setRules] = useState<any[]>([])
  const [apiUrl, setApiUrl] = useState(DEFAULT_API)
  const [status, setStatus] = useState('Connecting...')
  const [isOnline, setIsOnline] = useState(false)

  const [kw, setKw] = useState('')
  const [action, setAction] = useState('open_website')
  const [val, setVal] = useState('')

  const loadData = async (customUrl = apiUrl) => {
    try {
      const res = await fetch(`${customUrl}/commands`)
      if (!res.ok) throw new Error('Offline')
      const data = await res.json()
      setRules(data.rules || [])
      setStatus('ONLINE')
      setIsOnline(true)
    } catch (e) {
      setStatus('OFFLINE (Core unreachable)')
      setIsOnline(false)
    }
  }

  const saveData = async (newRules: any[]) => {
    try {
      await fetch(`${apiUrl}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: newRules })
      })
      loadData()
    } catch (e) {
      alert('Помилка збереження! VARTA не відповідає.')
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(), 5000)
    return () => clearInterval(interval)
  }, [apiUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!kw || !val) return

    const keywords = [kw.trim().toLowerCase()]
    let args = {}
    if (action === 'open_website') args = { url: val }
    else if (action === 'run_application') args = { app_name: val }
    else if (action === 'open_youtube' || action === 'search_google') args = { query: val }
    else if (action === 'type_keyboard') args = { text: val, press_enter: true }
    else if (action === 'press_hotkey') args = { keys: val }

    const newRule = {
      keywords,
      action,
      args,
      response: `Миттєво виконую: ${kw}`
    }

    saveData([...rules, newRule])
    setKw('')
    setVal('')
  }

  const handleDelete = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    saveData(newRules)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-label">MODULE_TRAINING // NEURAL LINK</div>
        <h1 className="page-title">VARTA COMMAND CENTER</h1>
        <div className="page-desc">Add or modify instant voice commands bypassing standard LLM routing.</div>
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div>CORE STATUS:</div>
          <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>{status}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        
        {/* ADD COMMAND PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">[+] REGISTER NEW DIRECT COMMAND</div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label style={{ color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>TRIGGER PHRASE (e.g. 'відкрий інсту'):</label>
                <input 
                  type="text" 
                  value={kw}
                  onChange={e => setKw(e.target.value)}
                  placeholder="відкрий інстаграм"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label style={{ color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>SYSTEM ACTION:</label>
                <select 
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--accent-bright)', padding: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}
                >
                  <option value="open_website">OPEN_WEBSITE (Browser)</option>
                  <option value="run_application">RUN_APPLICATION (Windows EXE)</option>
                  <option value="open_youtube">SEARCH_YOUTUBE</option>
                  <option value="search_google">SEARCH_GOOGLE</option>
                  <option value="type_keyboard">TYPE_KEYBOARD (Auto-type text)</option>
                  <option value="press_hotkey">PRESS_HOTKEY (e.g. ctrl+c)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label style={{ color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>ACTION PARAMETER (URL, exe name, text to type):</label>
                <input 
                  type="text" 
                  value={val}
                  onChange={e => setVal(e.target.value)}
                  placeholder="instagram.com"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                style={{ 
                  marginTop: 'var(--space-4)', 
                  padding: 'var(--space-3)', 
                  background: 'var(--status-offline)', 
                  color: 'white', 
                  border: 'none', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  letterSpacing: '0.1em'
                }}
                disabled={!isOnline}
              >
                UPLOAD TO CORE MEMORY
              </button>

            </form>
          </div>
        </div>

        {/* LIST COMMANDS PANEL */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">[=] ACTIVE NEURAL RULES</div>
            <div className="status-badge online">{rules.length} REGISTRY ENTRIES</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {!isOnline && (
              <div style={{ color: 'var(--status-offline)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                LOCAL VARTA DAEMON IS UNAVAILABLE
              </div>
            )}

            {isOnline && rules.length === 0 && (
              <div style={{ color: 'var(--text-dim)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                NO DIRECT COMMANDS FOUND IN REGISTRY
              </div>
            )}

            {rules.map((rule, index) => {
              let valStr = 'N/A'
              if (rule.args) {
                  if(rule.args.url) valStr = rule.args.url;
                  else if(rule.args.app_name) valStr = rule.args.app_name;
                  else if(rule.args.query) valStr = rule.args.query;
                  else if(rule.args.text) valStr = rule.args.text;
                  else if(rule.args.keys) valStr = rule.args.keys;
              }

              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <div style={{ fontSize: 'var(--text-base)', color: 'var(--status-online)', fontWeight: 'bold' }}>
                      "{rule.keywords.join('", "')}"
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
                      [{rule.action}] → <span style={{ color: 'var(--accent-bright)' }}>{valStr}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(index)}
                    style={{ background: 'transparent', border: '1px solid var(--status-offline)', color: 'var(--status-offline)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    DEL
                  </button>
                </div>
              )
            })}

          </div>
        </div>

      </div>
    </div>
  )
}
