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

  const { title, type, targetValue, currentValue, style } = await req.json()
  
  if (!title || !type || targetValue === undefined) {
    return NextResponse.json({ error: 'MISSING FIELDS' }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.userId,
      title,
      type,
      style: style || 'CLASSIC',
      targetValue: parseFloat(targetValue),
      currentValue: parseFloat(currentValue || 0)
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

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.type && { type: updates.type }),
      ...(updates.style && { style: updates.style }),
      ...(updates.targetValue !== undefined && { targetValue: parseFloat(updates.targetValue) }),
      ...(updates.currentValue !== undefined && { currentValue: parseFloat(updates.currentValue) }),
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
