import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are VARTA AI — the intelligent core of the VARTA control system.
You MUST respond EXCLUSIVELY in the VARTA Unified JSON format. No plain text outside the JSON.

JSON STRUCTURE:
{
  "intent": "chat" | "open_youtube" | "search_google" | "open_website" | "run_application" | "set_volume" | "control_pc" | "type_keyboard" | "press_hotkey",
  "payload": { ... arguments for the function ... },
  "response": "Brief human-readable message in the operator's language"
}

RULES:
1. If the operator is just talking/asking questions, use intent: "chat".
2. If identifying an action (e.g., "open youtube", "make it louder"), use the specific intent and fill the payload.
3. Respond in the same language as the operator (Ukrainian pref).
4. Be concise and technical.
5. All IDs and paths should be precise.`

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
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT + taskContext,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    // Build chat history
    const chatHistory = (history || []).map((msg: { role: string; text: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(message)
    const jsonResponse = JSON.parse(result.response.text())

    // Log the interaction
    await prisma.systemLog.create({
      data: {
        message: `AI [${jsonResponse.intent}]: "${message.substring(0, 60)}"`,
        level: 'INFO',
        userId: session.userId,
      },
    })

    return NextResponse.json(jsonResponse)
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
