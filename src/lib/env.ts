import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1, "NEXT_PUBLIC_VAPID_PUBLIC_KEY is required"),
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY is required"),
  VAPID_EMAIL: z.string().min(1, "VAPID_EMAIL is required"),
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, "CREDENTIALS_ENCRYPTION_KEY phải là chuỗi hex 64 ký tự (32 byte)"),
});

/**
 * Called once from instrumentation register(). Deliberately not evaluated at
 * module load of anything imported during `next build` — the Docker builder
 * stage has no runtime env and would fail the build.
 */
export function assertEnv(): void {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return;

  const missing = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Thiếu biến môi trường bắt buộc:\n${missing}`);
}
