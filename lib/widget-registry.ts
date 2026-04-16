import DayGoalsWidget from '@/components/life/widgets/DayGoalsWidget'
import NotesWidget from '@/components/life/widgets/NotesWidget'
import GoalWidget from '@/components/life/widgets/GoalWidget'
import HabitsWidget from '@/components/life/widgets/HabitsWidget'

export const WIDGET_REGISTRY: Record<string, any> = {
  'DAY_GOALS': {
    component: DayGoalsWidget,
    defaultTitle: 'DAY GOALS',
    minW: 280,
    minH: 350
  },
  'NOTES': {
    component: NotesWidget,
    defaultTitle: 'TACTICAL NOTES',
    minW: 200,
    minH: 150
  },
  'GOAL': {
    component: GoalWidget,
    defaultTitle: 'GOAL CONSOLE',
    minW: 240,
    minH: 240
  },
  'GOAL_HUD': { component: GoalWidget, defaultTitle: 'GOAL // HUD', minW: 240, minH: 240, data: { style: 'HUD' } },
  'GOAL_CIRCLE': { component: GoalWidget, defaultTitle: 'GOAL // CIRCLE', minW: 240, minH: 240, data: { style: 'CIRCLE' } },
  'GOAL_THERMOMETER': { component: GoalWidget, defaultTitle: 'GOAL // THERMO', minW: 200, minH: 300, data: { style: 'THERMOMETER' } },
  'GOAL_DIGITAL': { component: GoalWidget, defaultTitle: 'GOAL // DIGITAL', minW: 300, minH: 180, data: { style: 'DIGITAL' } },
  'GOAL_SEGMENTS': { component: GoalWidget, defaultTitle: 'GOAL // SEGMENTS', minW: 240, minH: 180, data: { style: 'SEGMENTS' } },
  'GOAL_ROAD': { component: GoalWidget, defaultTitle: 'GOAL // ROADMAP', minW: 300, minH: 180, data: { style: 'ROAD' } },
  'GOAL_SPARKLINE': { component: GoalWidget, defaultTitle: 'GOAL // TREND', minW: 240, minH: 240, data: { style: 'SPARKLINE' } },
  'HABITS': {
    component: HabitsWidget,
    defaultTitle: 'HABIT LOOP',
    minW: 260,
    minH: 380
  }
}
