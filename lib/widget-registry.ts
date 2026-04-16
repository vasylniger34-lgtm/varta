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
    defaultTitle: 'STRATEGIC GOAL',
    minW: 240,
    minH: 240
  },
  'HABITS': {
    component: HabitsWidget,
    defaultTitle: 'HABIT LOOP',
    minW: 260,
    minH: 380
  }
}
