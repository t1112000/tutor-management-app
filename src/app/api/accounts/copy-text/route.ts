import { NextResponse } from "next/server";
import { requireAccountType, parseBody, findOwnedAccount, jsonError } from "@/lib/auth-helpers";
import { copyTextSchema } from "@/lib/validations";
import { toAccountResponse } from "@/lib/accountResponse";
import { buildAccountCopyText } from "@/lib/accountCopyText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, copyTextSchema);
  if (badBody) return badBody;

  const accounts = [];
  for (const id of value.ids) {
    const account = await findOwnedAccount(user.id, id);
    if (!account) return jsonError(404, "Không tìm thấy tài khoản");
    accounts.push(toAccountResponse(account));
  }
  return NextResponse.json({ text: buildAccountCopyText(accounts) });
}
