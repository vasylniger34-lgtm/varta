import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check DB Connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Env Vars
    const envStatus = {
        DATABASE_URL: !!process.env.DATABASE_URL,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
        NODE_ENV: process.env.NODE_ENV
    }

    return NextResponse.json({ 
        status: 'ONLINE', 
        database: 'CONNECTED',
        env: envStatus
    })
  } catch (error: any) {
    return NextResponse.json({ 
        status: 'ERROR', 
        database: 'DISCONNECTED',
        error: error.message,
        env_db_set: !!process.env.DATABASE_URL
    }, { status: 500 })
  }
}
