import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateDayStats } from '@/lib/day-logic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are VARTA AI — the intelligent core of the VARTA control system.
You are tasked with managing the operator's personal board, tasks, and goals.

CAPABILITIES:
1. You can CREATE, UPDATE, and DELETE tasks across different periods (day, week, month).
2. You can query current board data if needed.
3. For daily tasks, always use the provided Day ID if applicable.

RESPONSE FORMAT:
You MUST respond EXCLUSIVELY in the VARTA Unified JSON format.
{
  "intent": "chat" | "create_task" | "update_task" | "delete_task" | "open_youtube" | etc.,
  "payload": { ... result or arguments ... },
  "response": "Human-readable confirmation message in operator's language (Ukrainian pref)"
}

RULES:
- Be concise and technical.
- Only use tools when explicitly asked to perform an action.
- If you perform an action, describe what you did in the "response" field.`

// Define Tools for Gemini
const tools: any = [
  {
    functionDeclarations: [
      {
        name: 'get_tasks',
        description: 'Fetches current active tasks for context.',
        parameters: {
          type: 'OBJECT',
          properties: {
            period: { type: 'STRING', enum: ['day', 'week', 'month'], description: 'Period to filter tasks' }
          }
        }
      },
      {
        name: 'create_task',
        description: 'Creates a new task in the database.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            period: { type: 'STRING', enum: ['day', 'week', 'month'] },
            dayId: { type: 'STRING', description: 'Optional day ID for daily tasks' }
          },
          required: ['title', 'period']
        }
      },
      {
        name: 'update_task',
        description: 'Updates a task state (mark as done, change title).',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            done: { type: 'BOOLEAN' },
            title: { type: 'STRING' }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_task',
        description: 'Completely removes a task.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' }
          },
          required: ['id']
        }
      }
    ]
  }
]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'MESSAGE REQUIRED' }, { status: 400 })
    }

    // 1. Get Today's Day entry (ensure AI has it)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let dayEntry = await prisma.day.findUnique({
      where: { userId_date: { userId: session.userId, date: today } }
    })
    
    if (!dayEntry) {
      dayEntry = await prisma.day.create({
        data: { userId: session.userId, date: today }
      })
    }

    // 2. Initial Context
    const activeTasks = await prisma.task.findMany({
      where: { userId: session.userId, done: false },
      take: 15,
      orderBy: { createdAt: 'desc' }
    })

    const contextAddition = `
Current Date: ${new Date().toLocaleDateString()}
Current Day ID (for daily tasks): ${dayEntry.id}
Active Tasks Context: ${activeTasks.map(t => `[${t.id}] ${t.title}`).join(', ')}
`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT + contextAddition,
      tools,
    })

    const chat = model.startChat({ 
      history: (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }))
    })

    let result = await chat.sendMessage(message)
    let responseText = result.response.text()
    let responseParts = result.response.candidates?.[0].content.parts || []

    // 3. Handle Function Calls (One level for simplicity)
    const functionCall = responseParts.find(p => p.functionCall)
    if (functionCall) {
      const { name, args }: any = functionCall.functionCall
      let apiResult = {}

      console.log(`[AI TOOL CALL] ${name}`, args)

      switch (name) {
        case 'get_tasks':
          const t = await prisma.task.findMany({ where: { userId: session.userId, period: args.period || 'day' } })
          apiResult = { tasks: t.map(tk => ({ id: tk.id, title: tk.title, done: tk.done })) }
          break
        
        case 'create_task':
          const newTask = await prisma.task.create({
            data: {
              title: args.title,
              period: args.period,
              userId: session.userId,
              dayId: args.dayId || (args.period === 'day' ? dayEntry.id : null),
              order: 0
            }
          })
          if (newTask.dayId) await updateDayStats(newTask.dayId)
          apiResult = { success: true, task: newTask }
          break

        case 'update_task':
          const updated = await prisma.task.update({
            where: { id: args.id },
            data: { 
              done: args.done !== undefined ? args.done : undefined,
              title: args.title || undefined
            }
          })
          if (updated.dayId) await updateDayStats(updated.dayId)
          apiResult = { success: true, taskId: updated.id }
          break

        case 'delete_task':
          const deleted = await prisma.task.delete({ where: { id: args.id } })
          if (deleted.dayId) await updateDayStats(deleted.dayId)
          apiResult = { success: true }
          break
      }

      // Send result back to model for final response
      result = await chat.sendMessage([{
        functionResponse: {
          name,
          response: apiResult
        }
      }])
      responseText = result.response.text()
    }

    // Clean response text from Markdown if Gemini hallucinations occur
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim()
    const jsonResponse = JSON.parse(cleanJson)

    // Log the interaction
    try {
      await prisma.systemLog.create({
        data: {
          message: `AI [${jsonResponse.intent}]: "${message.substring(0, 60)}"`,
          level: 'INFO',
          userId: session.userId,
        },
      })
    } catch (logError) {
      console.error('[LOG ERROR]', logError)
    }

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
