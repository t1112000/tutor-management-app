export type AddPicker = { dayOfWeek: number; startTime: string; endTime: string };
export type EditPicker = { id: number; dayOfWeek: number; startTime: string; endTime: string };

/** Monday-first labels; DAY_VALUES holds the matching JS getDay() numbers. */
export const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

export function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
