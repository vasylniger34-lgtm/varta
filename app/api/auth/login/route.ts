import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'CREDENTIALS REQUIRED' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'INVALID CREDENTIALS' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'INVALID CREDENTIALS' }, { status: 401 })
    }

    await prisma.systemLog.create({
      data: {
        message: `OPERATOR LOGIN: ${email}`,
        level: 'INFO',
        userId: user.id,
      },
    })

    const token = await signToken({ userId: user.id, email: user.email })

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    response.cookies.set('varta-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[LOGIN]', error)
    return NextResponse.json({ error: 'SYSTEM ERROR' }, { status: 500 })
  }
}
