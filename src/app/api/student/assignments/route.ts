import { getSessionUser } from "@/lib/auth";
import type { Assignment } from "@/lib/assignment-types";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

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
    publishedAt: document.publishedAt
      ? new Date(document.publishedAt as Date).toISOString()
      : new Date(document.createdAt as Date).toISOString(),
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
    published: true,
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Student sign-in is required." }, { status: 401 });
    }
    if (!user.semester) {
      return NextResponse.json(
        { error: "Your account needs a semester before assignments can be shown." },
        { status: 403 },
      );
    }
    const documents = await (await getDatabase())
      .collection("assignments")
      .find({ published: true, semester: user.semester })
      .sort({ publishedAt: -1 })
      .toArray();
    return NextResponse.json({
      semester: user.semester,
      assignments: documents.map(serializeAssignment),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
