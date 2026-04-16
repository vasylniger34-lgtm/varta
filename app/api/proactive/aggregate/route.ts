// PART 2 — Next.js API Route: Proactive Context Aggregator

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { active_window, battery, idle_seconds, timestamp, user_id } = await req.json();

    // 1. Authentication Check
    const bridgeKey = req.headers.get('x-varta-key');
    if (bridgeKey !== process.env.VARTA_BRIDGE_KEY) {
      return NextResponse.json({ error: 'UNAUTHORIZED_ACCESS' }, { status: 401 });
    }

    // 2. Rule-based Pre-filter
    const now = new Date();
    
    // Check for duplicate/recent notifications (within 10 mins)
    const recentNotification = await prisma.notificationLog.findFirst({
      where: {
        userId: user_id,
        createdAt: { gte: new Date(now.getTime() - 10 * 60 * 1000) }
      }
    });

    if (recentNotification) {
      return NextResponse.json({ should_notify: false, reason: 'THROTTLED_RECENT_SEND' });
    }

    // Logic: if no urgent tasks AND battery > 20% AND idle_seconds < 300 (5 mins) -> ignore
    // We fetch urgent tasks first to evaluate this.
    const urgentTasks = await prisma.task.findMany({
      where: {
        userId: user_id,
        done: false,
        period: 'day',
        // Note: You might want to add a 'deadline' field to the model if it exists,
        // for now we check tasks that are not done.
      },
      take: 5
    });

    if (urgentTasks.length === 0 && battery > 20 && idle_seconds < 300) {
      return NextResponse.json({ should_notify: false, reason: 'USER_BUSY_AND_NO_URGENCY' });
    }

    // 3. Aggregate Full Context
    const [overdueTasks, habits, goals, weather, userRules] = await Promise.all([
      // Overdue tasks (tasks from previous days not completed)
      prisma.task.findMany({
          where: { userId: user_id, done: false, createdAt: { lt: new Date(now.setHours(0,0,0,0)) } },
          take: 3
      }),
      // Habits not done today
      prisma.habit.findMany({
        where: {
          userId: user_id,
          OR: [
            { lastCompleted: null },
            { lastCompleted: { lt: new Date(now.setHours(0,0,0,0)) } }
          ]
        }
      }),
      // Goals progress
      prisma.goal.findMany({ where: { userId: user_id }, take: 3 }),
      // Weather cache
      prisma.weatherCache.findUnique({ where: { userId: user_id } }),
      // User notification rules
      prisma.notificationRules.findUnique({ where: { userId: user_id } })
    ]);

    // Check Silent Hours
    if (userRules?.silentFrom && userRules?.silentUntil) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [sfH, sfM] = userRules.silentFrom.split(':').map(Number);
        const [stH, stM] = userRules.silentUntil.split(':').map(Number);
        const silentFrom = sfH * 60 + sfM;
        const silentUntil = stH * 60 + stM;
        
        if (currentTime >= silentFrom && currentTime <= silentUntil) {
            return NextResponse.json({ should_notify: false, reason: 'SILENT_HOURS_ACTIVE' });
        }
    }

    // 4. Update Context Cache for future checks
    await prisma.userContextCache.upsert({
        where: { userId: user_id },
        update: { lastActiveWindow: active_window, batteryLevel: battery, lastSeenAt: now },
        create: { userId: user_id, lastActiveWindow: active_window, batteryLevel: battery }
    });

    // 5. Build AI Context
    const context = {
      active_window,
      battery,
      idle_seconds,
      weather: weather ? { temp: weather.temp, condition: weather.condition, rain: weather.rainChance } : 'Unknown',
      tasks: {
        urgent: urgentTasks.map(t => t.title),
        overdue: overdueTasks.map(t => t.title)
      },
      habits_pending: habits.map(h => h.title),
      goals_status: goals.map(g => `${g.title}: ${g.currentValue}/${g.targetValue}`)
    };

    // 6. Gemini Flash Call
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are VARTA, a neural companion OS. Your tone is cyberpunk, concise, and tactical. 
        Analyze the provided user context and generate a proactive update if relevant. 
        If you see a deadline, suggest action. If weather is bad and user has tasks, warn them. 
        If everything is fine, keep it short or mention a goal. 
        FORMAT: [TYPE] | [URGENCY] | [MESSAGE]
        TYPE: voice, popup, or silent.
        URGENCY: low, medium, or high.`
    });

    const prompt = `CURRENT_CONTEXT: ${JSON.stringify(context)}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse Response (e.g., "voice | medium | User, rain confirmed. Finish 'Buy bread' mission now.")
    const [typeRaw, urgencyRaw, message] = responseText.split('|').map(s => s.trim());
    
    // Validate parsing
    const type = (['voice', 'popup', 'silent'].includes(typeRaw.toLowerCase())) ? typeRaw.toLowerCase() : 'popup';
    const urgency = (['low', 'medium', 'high'].includes(urgencyRaw.toLowerCase())) ? urgencyRaw.toLowerCase() : 'low';

    // 7. Save to Notification Log
    await prisma.notificationLog.create({
      data: {
        userId: user_id,
        type,
        message,
        urgency,
        wasShown: true
      }
    });

    return NextResponse.json({
      should_notify: true,
      type,
      urgency,
      message
    });

  } catch (error: any) {
    console.error('PROACTIVE_ERROR:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', details: error.message }, { status: 500 });
  }
}
