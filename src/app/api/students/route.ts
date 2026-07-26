import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/auth-helpers";
import { Bill, Student, StudentSchedule } from "@/lib/db/index";
import { studentSchema } from "@/lib/validations";
import { Op, type WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    // The search box promises name / phone lookup, so search all three.
    ...(q
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { phone: { [Op.iLike]: `%${q}%` } },
            { parentPhone: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {}),
  };

  const students = await Student.findAll({
    where,
    include: [
      { model: StudentSchedule, as: "schedules" },
      { model: Bill, as: "bills", attributes: ["id"], where: { deletedAt: null }, required: false },
    ],
    order: [["name", "ASC"]],
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, studentSchema);
  if (badBody) return badBody;

  const student = await Student.create({ ...value, createdBy: user.id });
  return NextResponse.json(student, { status: 201 });
}
