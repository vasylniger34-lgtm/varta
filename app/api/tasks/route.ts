import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'day'

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.userId,
      period,
      parentId: null, // top-level only
    },
    include: {
      children: {
        include: {
          children: {
            include: { children: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { title, period, parentId, dayId } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'TITLE REQUIRED' }, { status: 400 })
  }

  const validPeriods = ['day', 'week', 'month']
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: 'INVALID PERIOD' }, { status: 400 })
  }

  // Get next order value
  const lastTask = await prisma.task.findFirst({
    where: { userId: session.userId, period, parentId: parentId || null, dayId: dayId || null },
    orderBy: { order: 'desc' },
  })
  const order = (lastTask?.order ?? -1) + 1

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      period,
      parentId: parentId || null,
      dayId: dayId || null,
      order,
      userId: session.userId,
    },
    include: { children: true },
  })

  // Update Day stats if it's a daily task
  if (dayId) {
    await updateDayStats(dayId)
  }

  return NextResponse.json({ task }, { status: 201 })
}

async function updateDayStats(dayId: string) {
  const tasks = await prisma.task.findMany({
    where: { dayId, parentId: null } // Only top-level tasks count for XP usually? Or all? 
    // Let's assume top-level tasks are the "goals".
  })

  const total = tasks.length
  const completed = tasks.filter(t => t.done).length
  const isCompleted = total > 0 && total === completed

  await prisma.day.update({
    where: { id: dayId },
    data: {
      totalTasks: total,
      completedTasks: completed,
      isCompleted
    }
  })
}
