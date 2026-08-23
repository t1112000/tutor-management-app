import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import type { FindOptions } from "sequelize";
import { auth } from "../../auth";
import { Bill, Student, Account, Customer, Order } from "@/lib/db/index";
import type { AccountType } from "@/lib/db/models/User";

export interface SessionUser {
  id: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accountType: AccountType;
}

type Guarded<T> = { value: T; response: null } | { value: null; response: NextResponse };

/**
 * Every error body is `{ error: <string> }` so the client never has to branch on
 * the shape. Zod issues are flattened into one readable Vietnamese sentence.
 */
export function jsonError(status: number, error: unknown): NextResponse {
  let message: string;
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof ZodError) {
    message = error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ");
  } else {
    message = "Có lỗi xảy ra";
  }
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<
  { user: SessionUser; response: null } | { user: null; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, response: jsonError(401, "Unauthorized") };
  }
  return { user: session.user as SessionUser, response: null };
}

/**
 * accountType is fixed at signup, so a tutor route reached by a reseller (or
 * vice versa) is a mistake, not a permission the user could plausibly have —
 * 403, not a redirect (API routes have nowhere to redirect to).
 */
export async function requireAccountType(
  expected: AccountType
): Promise<{ user: SessionUser; response: null } | { user: null; response: NextResponse }> {
  const { user, response } = await requireUser();
  if (response) return { user: null, response };
  if (user.accountType !== expected) {
    return { user: null, response: jsonError(403, "Không có quyền truy cập") };
  }
  return { user, response: null };
}

/**
 * Reads and validates a JSON body. Malformed JSON is a 400, not an unhandled 500.
 */
export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S
): Promise<Guarded<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { value: null, response: jsonError(400, "Dữ liệu gửi lên không hợp lệ") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { value: null, response: jsonError(400, parsed.error) };
  return { value: parsed.data, response: null };
}

function asId(id: string | number): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Ownership-scoped lookups. Every route must go through these instead of a bare
 * findByPk, otherwise a second account could read and edit the first one's data.
 */
export async function findOwnedStudent(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const studentId = asId(id);
  if (studentId === null) return null;
  return Student.findOne({
    ...rest,
    where: {
      id: studentId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findOwnedBill(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const billId = asId(id);
  if (billId === null) return null;
  return Bill.findOne({
    ...rest,
    where: {
      id: billId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findOwnedAccount(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const accountId = asId(id);
  if (accountId === null) return null;
  return Account.findOne({
    ...rest,
    where: {
      id: accountId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findOwnedCustomer(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const customerId = asId(id);
  if (customerId === null) return null;
  return Customer.findOne({
    ...rest,
    where: {
      id: customerId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findOwnedOrder(
  userId: number,
  id: string | number,
  options: Omit<FindOptions, "where"> & { includeDeleted?: boolean } = {}
) {
  const { includeDeleted = false, ...rest } = options;
  const orderId = asId(id);
  if (orderId === null) return null;
  return Order.findOne({
    ...rest,
    where: {
      id: orderId,
      createdBy: userId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
  });
}
