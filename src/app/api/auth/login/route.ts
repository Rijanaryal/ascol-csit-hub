import { ObjectId } from "mongodb";
import { z } from "zod";
import { assertAuthConfigured, createSession, verifyPassword, type UserRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
  role: z.enum(["student", "teacher"]),
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const { email, password, role } = parsed.data;
    assertAuthConfigured();
    const database = await getDatabase();
    const user = await database.collection("users").findOne({
      email: email.toLowerCase(),
      role,
    });

    if (
      !user ||
      typeof user.passwordHash !== "string" ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await createSession({
      id: (user._id as ObjectId).toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      semester: user.semester,
    });

    return NextResponse.json({ role });
  } catch (error) {
    return errorResponse(error);
  }
}
