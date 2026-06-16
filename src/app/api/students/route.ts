import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Student, StudentSchedule } from "@/lib/db/index";
import { studentSchema } from "@/lib/validations";
import { Op } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const where: any = { createdBy: user!.id };
  if (q) where.name = { [Op.iLike]: `%${q}%` };

  const students = await Student.findAll({
    where,
    include: [{ model: StudentSchedule, as: "schedules" }],
    order: [["name", "ASC"]],
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json();
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const student = await Student.create({ ...parsed.data, createdBy: user!.id });
  return NextResponse.json(student, { status: 201 });
}
