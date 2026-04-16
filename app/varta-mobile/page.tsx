'use client'

import React, { useState, useEffect } from 'react'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'
import MobileHomeView from '@/components/mobile/MobileHomeView'
import MobileLifeView from '@/components/mobile/MobileLifeView'
import MobileAIView from '@/components/mobile/MobileAIView'
import MobileChatView from '@/components/mobile/MobileChatView'
import MobileSettingsView from '@/components/mobile/MobileSettingsView'

export default function MobilePage() {
  const [activeView, setActiveView] = useState<'HOME' | 'LIFE' | 'AI' | 'CHAT' | 'SETTINGS'>('AI')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const renderView = () => {
    switch (activeView) {
      case 'HOME': return <MobileHomeView />
      case 'LIFE': return <MobileLifeView />
      case 'AI': return <MobileAIView />
      case 'CHAT': return <MobileChatView />
      case 'SETTINGS': return <MobileSettingsView />
      default: return <MobileAIView />
    }
  }

  return (
    <div className="varta-mobile-container">
      <div className="mobile-view-viewport animate-fade-in">
        {renderView()}
      </div>
      
      <MobileBottomNav 
        activeView={activeView} 
        onViewChange={(view) => setActiveView(view as any)} 
      />
    </div>
  )
}
