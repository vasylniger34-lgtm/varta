import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { updateDayStats } from '@/lib/day-logic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const task = await prisma.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  const body = await req.json()
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(typeof body.done === 'boolean' && { done: body.done }),
      ...(body.title && { title: body.title.trim() }),
    },
  })

  if (updated.dayId) {
    await updateDayStats(updated.dayId)
  }

  return NextResponse.json({ task: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const task = await prisma.task.findUnique({ where: { id: params.id } })
  if (!task || task.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id: params.id } })

  if (task.dayId) {
    await updateDayStats(task.dayId)
  }

  return NextResponse.json({ success: true })
}
