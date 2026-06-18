import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface CalendarSession {
  id: number
  scheduledDate: string
  startTime: string
  endTime: string
  isAttended: boolean
  bill: {
    id: number
    student: {
      name: string
      subject: 'english' | 'chinese'
      color: string | null
      type: 'offline' | 'online' | null
    }
  }
}

export function useCalendar(weekStart: string) {
  return useQuery({
    queryKey: keys.calendar.week(weekStart),
    queryFn: async () => {
      const res = await fetch(`/api/calendar?weekStart=${weekStart}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<CalendarSession[]>
    },
  })
}
