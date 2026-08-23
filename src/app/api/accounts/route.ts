import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody, jsonError } from "@/lib/auth-helpers";
import { Account } from "@/lib/db/index";
import { accountSchema } from "@/lib/validations";
import { encrypt } from "@/lib/crypto";
import { toAccountResponse, toAccountListResponse } from "@/lib/accountResponse";
import type { WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["available", "sold", "all"] as const;
const VALID_TYPES = ["netflix", "gpt_plus"] as const;

export async function GET(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const status = req.nextUrl.searchParams.get("status") ?? "available";
  const type = req.nextUrl.searchParams.get("type");

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return jsonError(400, "status không hợp lệ");
  }
  if (type !== null && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return jsonError(400, "type không hợp lệ");
  }

  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    ...(status !== "all" ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const accounts = await Account.findAll({ where, order: [["createdAt", "DESC"]] });
  return NextResponse.json(accounts.map(toAccountListResponse));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, accountSchema);
  if (badBody) return badBody;

  const account = await Account.create({
    type: value.type,
    email: value.email,
    passwordEncrypted: encrypt(value.password),
    twoFactorSecretEncrypted: value.twoFactorSecret ? encrypt(value.twoFactorSecret) : null,
    expiryDate: value.expiryDate,
    quotaPercent: value.quotaPercent ?? null,
    notes: value.notes ?? null,
    createdBy: user.id,
  });

  return NextResponse.json(toAccountResponse(account), { status: 201 });
}
