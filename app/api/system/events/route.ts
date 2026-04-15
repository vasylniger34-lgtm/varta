import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { type, payload } = await req.json()
  
  if (!type) {
    return NextResponse.json({ error: 'TYPE REQUIRED' }, { status: 400 })
  }

  const event = await prisma.eventLog.create({
    data: {
      userId: session.userId,
      type,
      payload: payload || {},
      timestamp: new Date()
    }
  })

  return NextResponse.json({ event })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const logs = await prisma.eventLog.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: 'desc' },
    take: 50
  })

  return NextResponse.json({ logs })
}
