'use client'

import React, { createContext, useContext, useCallback } from 'react'

export type SystemEventType = 
  | 'TASK_COMPLETED' 
  | 'TASK_CREATED' 
  | 'DAY_COMPLETED' 
  | 'DAY_FAILED' 
  | 'STREAK_UPDATED' 
  | 'WIDGET_MOVED'
  | 'WIDGET_RESIZED'
  | 'WIDGET_UPDATED'
  | 'WIDGET_CREATED'
  | 'GOAL_UPDATED'

interface SystemEvent {
  type: SystemEventType
  payload: any
  timestamp: Date
}

interface EventContextType {
  emitEvent: (type: SystemEventType, payload?: any) => Promise<void>
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: React.ReactNode }) {
  const emitEvent = useCallback(async (type: SystemEventType, payload: any = {}) => {
    const event: SystemEvent = {
      type,
      payload,
      timestamp: new Date()
    }

    console.log(`[EVENT] ${type}`, payload)

    // Log to DB via API
    try {
      await fetch('/api/system/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      })
    } catch (e) {
      console.error('Failed to log event to DB', e)
    }

    // Here we can add global UI reactions (toasts, sounds, etc)
    if (type === 'STREAK_UPDATED') {
       // logic for streak highlight
    }
  }, [])

  return (
    <EventContext.Provider value={{ emitEvent }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventContext)
  if (!context) throw new Error('useEvents must be used within an EventProvider')
  return context
}
