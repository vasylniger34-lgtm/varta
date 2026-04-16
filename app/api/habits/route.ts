import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const habits = await prisma.habit.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ habits })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { title, duration } = await req.json()
    const habit = await prisma.habit.create({
      data: {
        title,
        duration: duration || 15,
        userId: session.userId,
        streak: 0
      }
    })
    return NextResponse.json({ habit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id, title, duration, complete } = await req.json()
    
    if (complete) {
        const habit = await prisma.habit.findUnique({ where: { id } })
        if (!habit) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

        const now = new Date()
        const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null
        let newStreak = habit.streak

        if (!lastCompleted) {
            newStreak = 1
        } else {
            const diffDays = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays === 0) {
                // Already completed today, no streak change
            } else if (diffDays === 1) {
                newStreak += 1
            } else {
                newStreak = 1
            }
        }

        const updated = await prisma.habit.update({
            where: { id },
            data: { 
                streak: newStreak,
                lastCompleted: now
            }
        })
        return NextResponse.json({ habit: updated })
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { 
        title: title || undefined,
        duration: duration || undefined,
      }
    })
    return NextResponse.json({ habit: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID_REQUIRED' }, { status: 400 })

    await prisma.habit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
