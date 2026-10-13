import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { parseBody, jsonError } from "@/lib/auth-helpers";
import { User } from "@/lib/db/index";
import { signupSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { value, response: badBody } = await parseBody(req, signupSchema);
  if (badBody) return badBody;

  const existing = await User.findOne({ where: { email: value.email } });
  if (existing) return jsonError(409, "Email đã được sử dụng");

  const passwordHash = await bcrypt.hash(value.password, 12);
  const user = await User.create({
    email: value.email,
    name: value.name,
    passwordHash,
    accountType: value.accountType,
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
