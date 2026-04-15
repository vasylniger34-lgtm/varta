import { prisma } from './prisma'

export async function updateDayStats(dayId: string) {
  const tasks = await prisma.task.findMany({
    where: { dayId, parentId: null }
  })

  const total = tasks.length
  const completed = tasks.filter(t => t.done).length
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  let status = 'FAILED'
  if (percentage === 100) {
    status = 'COMPLETED'
  } else if (percentage >= 50) {
    status = 'PARTIAL'
  }

  await prisma.day.update({
    where: { id: dayId },
    data: {
      totalTasks: total,
      completedTasks: completed,
      completionPercentage: percentage,
      status,
      isCompleted: percentage === 100
    }
  })

  // Return values for possible further logic
  return { total, completed, percentage, status }
}

export async function logEvent(userId: string, type: string, payload: any = {}) {
  return await prisma.eventLog.create({
    data: {
      userId,
      type,
      payload,
      timestamp: new Date()
    }
  })
}
