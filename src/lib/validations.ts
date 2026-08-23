import { z } from "zod";

/** A real calendar date, not just the YYYY-MM-DD shape: "2026-13-45" is rejected. */
export const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "Ngày không hợp lệ");

/** A real clock time: the plain \d{2}:\d{2} shape would accept "25:99". */
export const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Định dạng HH:mm (00:00–23:59)");

export const studentSchema = z.object({
  name: z.string().min(1, "Tên học sinh không được trống"),
  phone: z.string().optional(),
  birthday: z.preprocess(
    (val) => (!val || val === "Invalid date" ? null : val),
    dateStr.nullable().optional()
  ),
  subject: z.enum(["english", "chinese"]),
  address: z.string().optional(),
  notes: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  color: z.string().nullable().optional(),
  type: z.enum(["offline", "online"]).default("offline"),
});

export const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeStr,
  endTime: timeStr,
});

export const billSchema = z.object({
  studentId: z.number().int().positive(),
  sessionCount: z.number().int().positive("Số buổi phải lớn hơn 0"),
  totalAmount: z.number().positive("Số tiền phải lớn hơn 0"),
  startDate: dateStr,
  notes: z.string().optional(),
  sessions: z.array(
    z.object({
      scheduledDate: dateStr,
      startTime: timeStr,
      endTime: timeStr,
    })
  ),
});

export const billUpdateSchema = z.object({
  totalAmount: z.number().positive("Số tiền phải lớn hơn 0").optional(),
  notes: z.string().nullable().optional(),
});

export const accountSchema = z.object({
  type: z.enum(["netflix", "gpt_plus"]),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được trống"),
  twoFactorSecret: z.string().optional(),
  expiryDate: dateStr,
  quotaPercent: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const accountUpdateSchema = z.object({
  email: z.string().email("Email không hợp lệ").optional(),
  password: z.string().min(1, "Mật khẩu không được trống").optional(),
  twoFactorSecret: z.string().nullable().optional(),
  expiryDate: dateStr.optional(),
  quotaPercent: z.number().int().min(0).max(100).nullable().optional(),
  status: z.enum(["available", "sold"]).optional(),
  notes: z.string().nullable().optional(),
});

export const accountImportSchema = z.object({
  type: z.enum(["netflix", "gpt_plus"]),
  text: z.string().min(1, "Danh sách không được trống"),
});

export const sessionCreateSchema = z.object({
  scheduledDate: dateStr,
  startTime: timeStr,
  endTime: timeStr,
});

export const sessionUpdateSchema = z.object({
  isAttended: z.boolean().optional(),
  scheduledDate: dateStr.optional(),
  startTime: timeStr.optional(),
  endTime: timeStr.optional(),
  notes: z.string().nullable().optional(),
});

export const scheduleUpdateSchema = z.object({
  scheduleId: z.number().int().positive(),
  startTime: timeStr,
  endTime: timeStr,
});

export const scheduleDeleteSchema = z.object({
  scheduleId: z.number().int().positive(),
});

/** Shape of a browser PushSubscription. The endpoint is later called server-side
 *  by web-push, so it must be a real HTTPS push-service URL, not arbitrary JSON. */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint không hợp lệ").startsWith("https://", "Endpoint phải dùng HTTPS"),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const signupSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  name: z.string().min(1, "Tên không được để trống"),
  accountType: z.enum(["tutor", "reseller"]),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(120),
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});
