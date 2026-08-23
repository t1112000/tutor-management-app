import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { Account } from "@/lib/db/index";
import { accountSchema } from "@/lib/validations";
import { encrypt, decrypt } from "@/lib/crypto";
import type { WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toResponse(account: Account) {
  return {
    id: account.id,
    type: account.type,
    email: account.email,
    password: decrypt(account.passwordEncrypted),
    twoFactorSecret: account.twoFactorSecretEncrypted ? decrypt(account.twoFactorSecretEncrypted) : null,
    expiryDate: account.expiryDate,
    quotaPercent: account.quotaPercent,
    status: account.status,
    notes: account.notes,
    createdAt: account.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const status = req.nextUrl.searchParams.get("status") ?? "available";
  const type = req.nextUrl.searchParams.get("type");

  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    ...(status !== "all" ? { status } : {}),
    ...(type ? { type } : {}),
  };

  const accounts = await Account.findAll({ where, order: [["createdAt", "DESC"]] });
  return NextResponse.json(accounts.map(toResponse));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
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

  return NextResponse.json(toResponse(account), { status: 201 });
}
