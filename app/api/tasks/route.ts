import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { updateDayStats } from '@/lib/day-logic'

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

  // Recursive mapping function
  const mapTasks = (tasks: any[]): any[] => {
    return tasks.map(t => ({
      ...t,
      done: t.status === 'DONE',
      children: t.children ? mapTasks(t.children) : []
    }))
  }

  return NextResponse.json({ tasks: mapTasks(tasks) })
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
