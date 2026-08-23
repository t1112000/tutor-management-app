import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody, findOwnedAccount, jsonError } from "@/lib/auth-helpers";
import { accountUpdateSchema } from "@/lib/validations";
import { encrypt } from "@/lib/crypto";
import { toAccountResponse } from "@/lib/accountResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  return NextResponse.json(toAccountResponse(account));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  const { value, response: badBody } = await parseBody(req, accountUpdateSchema);
  if (badBody) return badBody;

  if (value.email !== undefined) account.email = value.email;
  if (value.password !== undefined) account.passwordEncrypted = encrypt(value.password);
  if (value.twoFactorSecret !== undefined) {
    account.twoFactorSecretEncrypted = value.twoFactorSecret ? encrypt(value.twoFactorSecret) : null;
  }
  if (value.expiryDate !== undefined) account.expiryDate = value.expiryDate;
  if (value.quotaPercent !== undefined) account.quotaPercent = value.quotaPercent;
  if (value.status !== undefined) account.status = value.status;
  if (value.notes !== undefined) account.notes = value.notes;

  await account.save();
  return NextResponse.json(toAccountResponse(account));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const account = await findOwnedAccount(user.id, id);
  if (!account) return jsonError(404, "Không tìm thấy tài khoản");

  account.deletedAt = new Date();
  await account.save();
  return NextResponse.json({ ok: true });
}
