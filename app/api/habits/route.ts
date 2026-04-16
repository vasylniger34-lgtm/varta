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
    
    // Map currentStreak to streak for frontend
    const mappedHabits = habits.map(h => ({
      ...h,
      streak: h.currentStreak,
      lastCompleted: h.lastCompletedAt
    }))

    return NextResponse.json({ habits: mappedHabits })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { title, description, frequency } = await req.json()
    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        frequency: frequency || 'DAILY',
        userId: session.userId,
      }
    })
    return NextResponse.json({ habit: { ...habit, streak: habit.currentStreak } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id, title, description, frequency, complete } = await req.json()
    
    if (complete) {
        // Just create a log, the SQL trigger handles the streak update in the `Habit` table
        await prisma.habitLog.create({
            data: {
                habitId: id,
                userId: session.userId,
            }
        })
        
        const updated = await prisma.habit.findUnique({ where: { id } })
        return NextResponse.json({ 
          habit: { 
            ...updated, 
            streak: updated?.currentStreak, 
            lastCompleted: updated?.lastCompletedAt 
          } 
        })
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { 
        title: title || undefined,
        description: description || undefined,
        frequency: frequency || undefined,
      }
    })
    return NextResponse.json({ 
      habit: { 
        ...updated, 
        streak: updated.currentStreak, 
        lastCompleted: updated.lastCompletedAt 
      } 
    })
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
