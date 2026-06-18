export interface SessionSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface GeneratedSession {
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

export function generateSessions(
  startDate: string,
  sessionCount: number,
  schedules: SessionSlot[]
): GeneratedSession[] {
  if (!schedules.length || sessionCount <= 0) return [];

  const sorted = [...schedules].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : a.startTime.localeCompare(b.startTime)
  );

  const results: GeneratedSession[] = [];
  let current = new Date(startDate + "T00:00:00");
  const maxDays = sessionCount * 14 + 365;

  for (let guard = 0; results.length < sessionCount && guard < maxDays; guard++) {
    const dow = current.getDay();
    const isoDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    for (const slot of sorted.filter((s) => s.dayOfWeek === dow)) {
      if (results.length >= sessionCount) break;
      results.push({ scheduledDate: isoDate, startTime: slot.startTime, endTime: slot.endTime });
    }
    current.setDate(current.getDate() + 1);
  }

  return results;
}
