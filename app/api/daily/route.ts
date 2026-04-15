import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { updateDayStats } from '@/lib/day-logic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = session.userId
  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 1. Get/Create Streak
  let streak = await prisma.streak.findUnique({ where: { userId } })
  if (!streak) {
    streak = await prisma.streak.create({ data: { userId, current: 0, best: 0 } })
  }

  // 2. Get today's Day
  let today = await prisma.day.findUnique({
    where: { userId_date: { userId, date: todayDate } },
    include: { tasks: { orderBy: { order: 'asc' } } }
  })

  // 3. Logic: If today doesn't exist, we might need a reset/migration
  // We check for the latest day before today
  if (!today) {
    const lastDay = await prisma.day.findFirst({
      where: { userId, date: { lt: todayDate } },
      orderBy: { date: 'desc' },
      include: { tasks: true }
    })

    // If there's a last day, we need to handle migration
    // But we'll do this via a separate POST /api/daily/reset call from frontend 
    // or just handle it here if we want it to be fully automatic on GET.
    // User said "Automatic with animation", so maybe we return "needs_reset: true" 
    // and let frontend call POST /api/daily/reset to see the animation.
    
    if (lastDay) {
      return NextResponse.json({ 
        needsReset: true, 
        lastDayDate: lastDay.date,
        streak 
      })
    } else {
      // First day ever for this user
      today = await prisma.day.create({
        data: { userId, date: todayDate },
        include: { tasks: true }
      })
    }
  }

  return NextResponse.json({ today, streak })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = session.userId
  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Check if reset already happened
  const existingToday = await prisma.day.findUnique({
    where: { userId_date: { userId, date: todayDate } }
  })
  if (existingToday) return NextResponse.json({ today: existingToday, message: 'ALREADY_RESET' })

  // Find the last day
  const lastDay = await prisma.day.findFirst({
    where: { userId, date: { lt: todayDate } },
    orderBy: { date: 'desc' },
    include: { tasks: { where: { done: false } } }
  })

  let currentStreak = 0
  const streakRecord = await prisma.streak.findUnique({ where: { userId } })

  if (lastDay) {
    // New Streak Logic:
    // COMPLETED -> +1
    // PARTIAL -> No change (persist)
    // FAILED -> Reset to 0
    
    const wasCompleted = lastDay.status === 'COMPLETED'
    const wasPartial = lastDay.status === 'PARTIAL'
    
    if (wasCompleted) {
      currentStreak = (streakRecord?.current || 0) + 1
    } else if (wasPartial) {
      currentStreak = (streakRecord?.current || 0)
    } else {
      currentStreak = 0
    }
    
    // Update streak record
    await prisma.streak.update({
      where: { userId },
      data: { 
        current: currentStreak,
        best: { set: Math.max(streakRecord?.best || 0, currentStreak) }
      }
    })
  }

  // Create new day
  const newDay = await prisma.day.create({
    data: {
      userId,
      date: todayDate,
      status: 'FAILED',
      completionPercentage: 0,
      totalTasks: lastDay ? lastDay.tasks.length : 0,
    }
  })

  // Migrate unfinished tasks
  if (lastDay && lastDay.tasks.length > 0) {
    for (const task of lastDay.tasks) {
      await prisma.task.create({
        data: {
          title: task.title,
          userId,
          dayId: newDay.id,
          order: task.order,
          period: 'day',
          done: false, // ensure they stay unfinished in the new day
        }
      })
    }
  }

  const finalDay = await prisma.day.findUnique({
    where: { id: newDay.id },
    include: { tasks: { orderBy: { order: 'asc' } } }
  })

  return NextResponse.json({ today: finalDay, streak: { current: currentStreak } })
}
