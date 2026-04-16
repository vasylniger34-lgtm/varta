import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
      take: 50 // Load last 50 messages for the UI
    })

    return NextResponse.json({ 
      messages: messages.map(m => ({
        role: m.role.toLowerCase(),
        text: m.text,
        createdAt: m.createdAt
      })) 
    })
  } catch (error: any) {
    console.error('[HISTORY ERROR]', error)
    return NextResponse.json({ error: 'FAILED TO FETCH HISTORY' }, { status: 500 })
  }
}
