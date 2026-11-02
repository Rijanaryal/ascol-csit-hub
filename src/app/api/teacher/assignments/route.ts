import { ObjectId } from "mongodb";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import type { Assignment } from "@/lib/assignment-types";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const assignmentSchema = z.object({
  title: z.string().trim().min(3).max(120),
  subject: z.string().trim().min(2).max(100),
  semester: z.number().int().min(1).max(8),
  description: z.string().trim().max(2000).default(""),
  dueDate: z.string().datetime().optional(),
});

function serializeAssignment(document: Record<string, unknown>): Assignment {
  const files = Array.isArray(document.files) ? document.files : [];
  return {
    id: String(document._id),
    title: String(document.title),
    subject: String(document.subject),
    semester: Number(document.semester),
    description: String(document.description ?? ""),
    teacherName: String(document.teacherName),
    createdAt: new Date(document.createdAt as Date).toISOString(),
    dueDate: document.dueDate
      ? new Date(document.dueDate as Date).toISOString()
      : undefined,
    files: files.map((value) => {
      const file = value as Record<string, unknown>;
      return {
        id: String(file.id),
        name: String(file.name),
        contentType: String(file.contentType),
        size: Number(file.size),
      };
    }),
    published: document.published === true,
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Teacher sign-in is required." }, { status: 401 });
    }

    const database = await getDatabase();
    const documents = await database
      .collection("assignments")
      .find({ teacherId: user.id })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ assignments: documents.map(serializeAssignment) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Teacher sign-in is required." }, { status: 401 });
    }

    const parsed = assignmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check the assignment details." },
        { status: 400 },
      );
    }

    const database = await getDatabase();
    const assignment = {
      ...parsed.data,
      semester: parsed.data.semester,
      ...(parsed.data.dueDate ? { dueDate: new Date(parsed.data.dueDate) } : {}),
      teacherId: user.id,
      teacherName: user.name,
      files: [],
      published: false,
      createdAt: new Date(),
    };
    const result = await database.collection("assignments").insertOne(assignment);
    return NextResponse.json(
      { assignment: serializeAssignment({ ...assignment, _id: new ObjectId(result.insertedId) }) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
