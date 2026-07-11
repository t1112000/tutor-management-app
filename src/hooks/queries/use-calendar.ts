import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'

export interface CalendarSession {
  id: number
  scheduledDate: string
  startTime: string
  endTime: string
  isAttended: boolean
  notes: string | null
  bill: {
    id: number
    student: {
      name: string
      subject: 'english' | 'chinese'
      color: string | null
      type: 'offline' | 'online' | null
      address: string | null
    }
  }
}

export interface FixedCalendarSession {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
  student: {
    id: number
    name: string
    subject: 'english' | 'chinese'
    color: string | null
    type: 'offline' | 'online' | null
    address: string | null
  }
}

const calendarQueryOptions = {
  staleTime: 0,
  gcTime: 60 * 1000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 60 * 1000,
}

export function useCalendar(weekStart: string, enabled = true) {
  return useQuery({
    queryKey: keys.calendar.week(weekStart),
    enabled,
    ...calendarQueryOptions,
    queryFn: async () => {
      const res = await fetch(`/api/calendar?weekStart=${weekStart}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<CalendarSession[]>
    },
  })
}

export function useFixedCalendar(enabled = true) {
  return useQuery({
    queryKey: keys.calendar.fixed(),
    enabled,
    ...calendarQueryOptions,
    queryFn: async () => {
      const res = await fetch('/api/calendar/fixed', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<FixedCalendarSession[]>
    },
  })
}
