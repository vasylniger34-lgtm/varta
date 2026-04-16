// PART 3 — Context Aggregator: getDailyContext Function

import { prisma } from './prisma';
import { Task, Habit, Goal, DailyReview, Priority } from '@prisma/client';

export type VartaDailyContext = {
  overdueTasks: Task[];
  todaysTasks: Task[];
  pendingHabits: Habit[];
  activeGoals: Goal[];
  todayReview: DailyReview | null;
  summary: {
    urgentCount: number;
    overdueCount: number;
    habitCompletionRate: number; // 0-1
    criticalGoals: number; // goals with progress < 20%
  };
};

/**
 * Fetches the unified daily context from the SQL view and calculates derived metrics.
 * Used by the proactive notification system to understand the user's current situation.
 */
export async function getDailyContext(userId: string): Promise<VartaDailyContext> {
  try {
    // 1. Query the Unified SQL View via Prisma Raw
    // PostgreSQL column names in the view are overdue_tasks, todays_tasks, etc.
    const rawResult: any[] = await prisma.$queryRaw`
      SELECT * FROM varta_daily_context WHERE user_id = ${userId}
    `;

    if (!rawResult || rawResult.length === 0) {
      throw new Error(`User context not found for ID: ${userId}`);
    }

    const data = rawResult[0];

    // 2. Parse JSON fields from the view (Postgres returns them as arrays/objects)
    const overdueTasks: Task[] = data.overdue_tasks || [];
    const todaysTasks: Task[] = data.todays_tasks || [];
    const pendingHabits: Habit[] = data.pending_habits || [];
    const activeGoals: Goal[] = data.active_goals || [];
    const todayReview: DailyReview | null = data.today_review || null;

    // 3. Calculate Derived Metrics
    const urgentCount = todaysTasks.filter(t => t.priority === Priority.CRITICAL || t.priority === Priority.HIGH).length;
    
    // Total habits for the user to calculate completion rate
    const totalActiveHabitsCount = await prisma.habit.count({
        where: { userId, isActive: true }
    });
    
    const habitsCompletedTodayCount = totalActiveHabitsCount - pendingHabits.length;
    const habitCompletionRate = totalActiveHabitsCount > 0 
        ? habitsCompletedTodayCount / totalActiveHabitsCount 
        : 1;

    const criticalGoals = activeGoals.filter(g => g.progressPercent < 20).length;

    return {
      overdueTasks,
      todaysTasks,
      pendingHabits,
      activeGoals,
      todayReview,
      summary: {
        urgentCount,
        overdueCount: overdueTasks.length,
        habitCompletionRate,
        criticalGoals
      }
    };

  } catch (error) {
    console.error('[GET_DAILY_CONTEXT_ERROR]:', error);
    // Return empty context on error to prevent total system failure
    return {
      overdueTasks: [],
      todaysTasks: [],
      pendingHabits: [],
      activeGoals: [],
      todayReview: null,
      summary: { urgentCount: 0, overdueCount: 0, habitCompletionRate: 0, criticalGoals: 0 }
    };
  }
}
