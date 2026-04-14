import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are VARTA AI — the intelligent core of the VARTA control system.
Your purpose: assist the operator in managing their life, tasks, projects, and smart home.
Personality: direct, concise, technical. No fluff, no excessive pleasantries.
Respond in the same language the operator uses (Ukrainian, English, etc.).
When discussing tasks, you can reference what the operator has shared.
Format your responses clearly, using bullet points or sections when helpful.`

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'MESSAGE REQUIRED' }, { status: 400 })
    }

    // Fetch user's recent tasks to give AI context
    const tasks = await prisma.task.findMany({
      where: { userId: session.userId, done: false },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })

    const taskContext = tasks.length > 0
      ? `\n\nOperator's active tasks:\n${tasks.map(t => `- [${t.period.toUpperCase()}] ${t.title}`).join('\n')}`
      : ''

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: SYSTEM_PROMPT + taskContext,
    })

    // Build chat history
    const chatHistory = (history || []).map((msg: { role: string; text: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(message)
    const text = result.response.text()

    // Log the interaction
    await prisma.systemLog.create({
      data: {
        message: `AI QUERY: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
        level: 'INFO',
        userId: session.userId,
      },
    })

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('[AI ERROR]', {
      message: error.message,
      stack: error.stack,
      status: error.status
    })
    return NextResponse.json({ 
      error: 'AI CORE UNAVAILABLE',
      details: error.message 
    }, { status: 500 })
  }
}
