'use client'

import React from 'react'
import { Home, Layout, Sparkles, MessageSquare, Settings } from 'lucide-react'

type MobileBottomNavProps = {
  activeView: string
  onViewChange: (view: string) => void
}

const NAV_ITEMS = [
  { id: 'HOME', icon: Home, label: 'BASE' },
  { id: 'LIFE', icon: Layout, label: 'BOARD' },
  { id: 'AI', icon: Sparkles, label: 'VARTA' },
  { id: 'CHAT', icon: MessageSquare, label: 'COMMS' },
  { id: 'SETTINGS', icon: Settings, label: 'SYSTEM' },
]

export default function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav-v2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id
        
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="mobile-nav-icon-wrapper">
              <Icon size={20} />
              {isActive && <div className="mobile-nav-glow" />}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
