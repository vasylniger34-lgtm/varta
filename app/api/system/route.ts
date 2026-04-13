import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const logs = await prisma.systemLog.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { createdAt: true, email: true, name: true },
  })

  const taskStats = await prisma.task.groupBy({
    by: ['done'],
    where: { userId: session.userId },
    _count: true,
  })

  const total = taskStats.reduce((a, b) => a + b._count, 0)
  const done = taskStats.find(s => s.done)?._count || 0

  return NextResponse.json({
    status: 'OPERATIONAL',
    user,
    taskStats: { total, done, pending: total - done },
    logs,
  })
}
