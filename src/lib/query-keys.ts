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
    fixed: () => ['calendar', 'fixed'] as const,
  },
  report: {
    month: (month: string) => ['report', 'month', month] as const,
    all: () => ['report', 'all'] as const,
  },
  accounts: {
    all:    ()           => ['accounts'] as const,
    list:   (status = 'available', type = '') => ['accounts', 'list', status, type] as const,
    detail: (id: number) => ['accounts', id] as const,
  },
} as const
