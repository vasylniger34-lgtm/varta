import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateDayStats } from '@/lib/day-logic'

export async function POST(req: NextRequest) {
  const bridgeKey = req.headers.get('x-varta-bridge-key')?.trim()
  const expectedKey = process.env.VARTA_BRIDGE_KEY?.trim()
  
  if (!bridgeKey || bridgeKey !== expectedKey) {
    return NextResponse.json({ error: 'UNAUTHORIZED_BRIDGE' }, { status: 401 })
  }

  try {
    const { action, payload, userId } = await req.json()
    
    // For local assistant, we prioritize the owner email
    let targetUserId = userId
    if (!targetUserId) {
      if (process.env.VARTA_OWNER_EMAIL) {
        const owner = await prisma.user.findUnique({
          where: { email: process.env.VARTA_OWNER_EMAIL }
        })
        targetUserId = owner?.id
      }
      
      // Fallback to first user if no owner email or user not found
      if (!targetUserId) {
        const firstUser = await prisma.user.findFirst()
        targetUserId = firstUser?.id
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'USER_NOT_FOUND', details: 'No valid user for sync' }, { status: 404 })
    }

    console.log(`[BOARD BRIDGE] Action: ${action}`, payload)

    switch (action) {
      case 'create_task': {
        // Find or create today's Day (using exact same logic as daily/route.ts)
        const now = new Date()
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        let dayEntry = await prisma.day.findUnique({
          where: { userId_date: { userId: targetUserId, date: todayDate } }
        })
        
        if (!dayEntry) {
          dayEntry = await prisma.day.create({
            data: { userId: targetUserId, date: todayDate }
          })
        }

        const newTask = await prisma.task.create({
          data: {
            title: payload.title,
            period: payload.period || 'day',
            userId: targetUserId,
            dayId: payload.period === 'day' ? dayEntry.id : null,
            order: 0
          }
        })
        
        if (newTask.dayId) await updateDayStats(newTask.dayId)
        return NextResponse.json({ success: true, task: newTask })
      }

      case 'update_task': {
        const task = await prisma.task.update({
          where: { id: payload.id },
          data: { 
            done: payload.done !== undefined ? payload.done : undefined,
            title: payload.title || undefined
          }
        })
        if (task.dayId) await updateDayStats(task.dayId)
        return NextResponse.json({ success: true, task })
      }

      case 'find_task': {
        // Search by title (fuzzy-ish or partial)
        const tasks = await prisma.task.findMany({
          where: { 
            userId: targetUserId, 
            title: { contains: payload.query, mode: 'insensitive' },
            done: false
          },
          take: 5
        })
        return NextResponse.json({ success: true, tasks })
      }

      case 'get_status': {
        const activeTasks = await prisma.task.findMany({
          where: { userId: targetUserId, done: false },
          take: 10
        })
        return NextResponse.json({ success: true, activeTasks })
      }

      case 'sync_chat': {
        const { text, role } = payload
        const msg = await prisma.chatMessage.create({
          data: {
            text,
            role: role.toUpperCase(), // USER or MODEL
            userId: targetUserId
          }
        })
        return NextResponse.json({ success: true, messageId: msg.id })
      }

      case 'create_habit': {
        const { title, duration } = payload
        const habit = await prisma.habit.create({
          data: {
            title,
            duration: duration || 15,
            userId: targetUserId
          }
        })
        return NextResponse.json({ success: true, habitId: habit.id })
      }

      default:
        return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[BRIDGE ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
