import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(1, "Tên học sinh không được trống"),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  subject: z.enum(["english", "chinese"]),
  address: z.string().optional(),
  notes: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

export const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Định dạng HH:mm"),
});

export const billSchema = z.object({
  studentId: z.number().int().positive(),
  sessionCount: z.number().int().positive("Số buổi phải lớn hơn 0"),
  totalAmount: z.number().positive("Số tiền phải lớn hơn 0"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  sessions: z.array(
    z.object({
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })
  ),
});

export const notificationSettingsSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  notificationEmail: z.string().email().optional().or(z.literal("")),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type BillFormData = z.infer<typeof billSchema>;
