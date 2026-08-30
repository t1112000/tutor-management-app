import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { api } from '@/lib/api-client'

export interface CalendarSession {
  id: number
  scheduledDate: string
  startTime: string
  endTime: string
  isAttended: boolean
  notes: string | null
  bill: {
    id: number
    status: 'unpaid' | 'paid'
    notes: string | null
    student: {
      id: number
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

// gcTime must outlive the persisted cache, otherwise the IndexedDB persister has
// nothing to restore and every visit starts on the full-screen loading skeleton.
const calendarQueryOptions = {
  staleTime: 0,
  gcTime: 24 * 60 * 60 * 1000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
}

export function useCalendar(weekStart: string, enabled = true) {
  return useQuery({
    queryKey: keys.calendar.week(weekStart),
    enabled,
    ...calendarQueryOptions,
    // Only the live week polls; the dashboard mounts this hook too.
    refetchInterval: 60 * 1000,
    queryFn: () => api<CalendarSession[]>(`/api/calendar?weekStart=${weekStart}`),
  })
}

export function useFixedCalendar(enabled = true) {
  return useQuery({
    queryKey: keys.calendar.fixed(),
    enabled,
    // No refetchInterval: recurring weekly slots only change through mutations,
    // which already invalidate the ['calendar'] key.
    ...calendarQueryOptions,
    queryFn: () => api<FixedCalendarSession[]>('/api/calendar/fixed'),
  })
}
