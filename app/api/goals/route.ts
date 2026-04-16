import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const goals = await prisma.goal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ goals })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { title, category, targetValue, currentValue, visualStyle, status } = await req.json()
  
  if (!title || targetValue === undefined) {
    return NextResponse.json({ error: 'MISSING FIELDS' }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.userId,
      title,
      category: category || 'PERSONAL',
      visualStyle: visualStyle || 'PROGRESS_BAR',
      status: status || 'ACTIVE',
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue || 0),
      progressPercent: Math.round((parseFloat(currentValue || 0) / parseFloat(targetValue)) * 100)
    }
  })

  return NextResponse.json({ goal })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id, ...updates } = await req.json()
  
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  // Calculate new progress percent if values change
  const newTarget = updates.targetValue !== undefined ? parseFloat(updates.targetValue) : goal.targetValue;
  const newCurrent = updates.currentValue !== undefined ? parseFloat(updates.currentValue) : goal.currentValue;
  const progressPercent = Math.round((newCurrent / newTarget) * 100);

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.category && { category: updates.category }),
      ...(updates.visualStyle && { visualStyle: updates.visualStyle }),
      ...(updates.status && { status: updates.status }),
      ...(updates.targetValue !== undefined && { targetValue: newTarget }),
      ...(updates.currentValue !== undefined && { currentValue: newCurrent }),
      progressPercent,
      ...(updates.milestones && { milestones: updates.milestones }),
    }
  })

  return NextResponse.json({ goal: updated })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID REQUIRED' }, { status: 400 })

  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
