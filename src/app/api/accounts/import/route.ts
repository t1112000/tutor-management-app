import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody, jsonError } from "@/lib/auth-helpers";
import { Account, sequelize } from "@/lib/db/index";
import { accountImportSchema } from "@/lib/validations";
import { parseAccountImportText } from "@/lib/accountImport";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, accountImportSchema);
  if (badBody) return badBody;

  const parsed = parseAccountImportText(value.text);
  if (!parsed.ok) return jsonError(400, parsed.errors.join("; "));

  await sequelize.transaction(async (t) => {
    await Account.bulkCreate(
      parsed.accounts.map((line) => ({
        type: value.type,
        email: line.email,
        passwordEncrypted: encrypt(line.password),
        twoFactorSecretEncrypted: line.twoFactorSecret ? encrypt(line.twoFactorSecret) : null,
        expiryDate: line.expiryDate,
        quotaPercent: null,
        status: "available" as const,
        notes: null,
        createdBy: user.id,
      })),
      { transaction: t }
    );
  });

  return NextResponse.json({ created: parsed.accounts.length }, { status: 201 });
}
