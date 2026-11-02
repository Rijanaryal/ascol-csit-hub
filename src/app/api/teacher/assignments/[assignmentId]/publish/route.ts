import { ObjectId } from "mongodb";
import { getSessionUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Teacher sign-in is required." }, { status: 401 });
    }

    const { assignmentId } = await context.params;
    if (!ObjectId.isValid(assignmentId)) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    const result = await (await getDatabase()).collection("assignments").updateOne(
      {
        _id: new ObjectId(assignmentId),
        teacherId: user.id,
        "files.0": { $exists: true },
      },
      { $set: { published: true, publishedAt: new Date() } },
    );
    if (result.modifiedCount !== 1) {
      return NextResponse.json(
        { error: "Add at least one valid file before publishing." },
        { status: 400 },
      );
    }
    return NextResponse.json({ published: true });
  } catch (error) {
    return errorResponse(error);
  }
}
