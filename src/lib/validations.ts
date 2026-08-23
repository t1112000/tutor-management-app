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
  notes: z.string().nullable().optional(),
});

export const accountImportSchema = z.object({
  type: z.enum(["netflix", "gpt_plus"]),
  text: z.string().min(1, "Danh sách không được trống"),
});

export const customerContactType = z.enum(["facebook", "zalo", "discord", "telegram"]);

export const customerContactSchema = z.object({
  type: customerContactType,
  value: z.string().trim().min(1, "Thông tin liên hệ không được trống"),
});

const customerObjectSchema = z.object({
  name: z.string().trim().min(1, "Tên khách không được trống"),
  notes: z.string().optional(),
  contacts: z.array(customerContactSchema).optional(),
});

function uniqueContactTypes(
  val: { contacts?: { type: z.infer<typeof customerContactType> }[] },
  ctx: z.RefinementCtx
) {
  const types = (val.contacts ?? []).map((c) => c.type);
  if (new Set(types).size !== types.length) {
    ctx.addIssue({ code: "custom", message: "Mỗi loại liên hệ chỉ được một", path: ["contacts"] });
  }
}

export const customerSchema = customerObjectSchema.superRefine(uniqueContactTypes);

/** superRefine wraps a ZodEffects, which has no .partial(). */
export const customerUpdateSchema = customerObjectSchema.partial().extend({
  contacts: z.array(customerContactSchema).optional(),
}).superRefine(uniqueContactTypes);

export const orderLineInputSchema = z.object({
  accountId: z.number().int().positive(),
  warrantyType: z.enum(["kbh", "bhf", "days"]),
  warrantyDays: z.number().int().min(1).optional(),
  price: z.number().int().min(0),
}).superRefine((val, ctx) => {
  if (val.warrantyType === "days" && val.warrantyDays == null) {
    ctx.addIssue({ code: "custom", message: "Chọn số ngày bảo hành", path: ["warrantyDays"] });
  }
  if (val.warrantyType !== "days" && val.warrantyDays != null) {
    ctx.addIssue({ code: "custom", message: "Số ngày chỉ dùng với loại Theo ngày", path: ["warrantyDays"] });
  }
});

export const orderCreateSchema = z.object({
  customerId: z.number().int().positive().optional(),
  customer: customerSchema.optional(),
  notes: z.string().optional(),
  lines: z.array(orderLineInputSchema).min(1, "Chọn ít nhất một tài khoản"),
}).superRefine((val, ctx) => {
  if (!val.customerId && !val.customer) {
    ctx.addIssue({ code: "custom", message: "Chọn khách hoặc tạo khách mới", path: ["customerId"] });
  }
  if (val.customerId && val.customer) {
    ctx.addIssue({ code: "custom", message: "Chỉ chọn khách có sẵn hoặc tạo mới, không gửi cả hai", path: ["customer"] });
  }
  const ids = val.lines.map((l) => l.accountId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", message: "Trùng tài khoản trong một đơn", path: ["lines"] });
  }
});

export const orderReplaceSchema = z.object({
  accountId: z.number().int().positive(),
});

export const copyTextSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

export const orderCopyTextSchema = z.object({
  ids: z.array(z.number().int().positive()).optional(),
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
