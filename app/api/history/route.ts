import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const days = await prisma.day.findMany({
    where: { userId: session.userId },
    orderBy: { date: 'desc' },
    take: 30
  })

  return NextResponse.json({ days })
}
