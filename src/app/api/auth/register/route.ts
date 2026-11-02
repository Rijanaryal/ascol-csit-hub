import { z } from "zod";
import { assertAuthConfigured, hashPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { getDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  role: z.enum(["student", "teacher"]),
  semester: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check the registration details." },
        { status: 400 },
      );
    }

    const input = parsed.data;
    if (Buffer.byteLength(input.password, "utf8") > 72) {
      return NextResponse.json({ error: "Password must be 72 bytes or shorter." }, { status: 400 });
    }
    if (input.role === "student" && !input.semester) {
      return NextResponse.json({ error: "Choose your semester." }, { status: 400 });
    }

    assertAuthConfigured();
    const database = await getDatabase();
    const users = database.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });

    const user = {
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash: await hashPassword(input.password),
      ...(input.role === "student" ? { semester: input.semester } : {}),
      createdAt: new Date(),
    };

    try {
      await users.insertOne(user);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ role: user.role }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
