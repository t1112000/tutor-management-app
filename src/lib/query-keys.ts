export const keys = {
  students: {
    all:    ()           => ['students'] as const,
    list:   (q = '')     => ['students', 'list', q] as const,
    detail: (id: number) => ['students', id] as const,
  },
  bills: {
    detail: (id: number) => ['bills', id] as const,
  },
  calendar: {
    week: (weekStart: string) => ['calendar', weekStart] as const,
  },
  report: {
    month: (month: string) => ['report', month] as const,
  },
} as const
