import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const widgets = await prisma.widget.findMany({
    where: { userId: session.userId },
  })
  
  // If no widgets, create default ones
  if (widgets.length === 0) {
    const defaultWidgets = [
      { type: 'DAY_GOALS', posX: 40, posY: 40, w: 320, h: 450, userId: session.userId },
      { type: 'NOTES', posX: 400, posY: 40, w: 300, h: 250, userId: session.userId }
    ]
    const created = []
    for (const w of defaultWidgets) {
      created.push(await prisma.widget.create({ data: w }))
    }
    return NextResponse.json({ widgets: created })
  }

  return NextResponse.json({ widgets })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { type, posX, posY, w, h, data } = await req.json()
  const widget = await prisma.widget.create({
    data: {
      type,
      posX: posX || 0,
      posY: posY || 0,
      w: w || 300,
      h: h || 200,
      data,
      userId: session.userId,
    }
  })

  return NextResponse.json({ widget })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  const widget = await prisma.widget.findUnique({ where: { id } })
  if (!widget || widget.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  const updated = await prisma.widget.update({
    where: { id },
    data: {
      ...(updates.posX !== undefined && { posX: updates.posX }),
      ...(updates.posY !== undefined && { posY: updates.posY }),
      ...(updates.w !== undefined && { w: updates.w }),
      ...(updates.h !== undefined && { h: updates.h }),
      ...(updates.data !== undefined && { data: updates.data }),
    }
  })

  return NextResponse.json({ widget: updated })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID REQUIRED' }, { status: 400 })

  const widget = await prisma.widget.findUnique({ where: { id } })
  if (!widget || widget.userId !== session.userId) {
    return NextResponse.json({ error: 'NOT FOUND' }, { status: 404 })
  }

  await prisma.widget.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
