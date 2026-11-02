import { ObjectId, type GridFSFile } from "mongodb";
import { getSessionUser } from "@/lib/auth";
import { getDatabase, getUploadsBucket } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assignmentId: string; fileId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to access assignment files." }, { status: 401 });
    }
    if (user.role === "student" && !user.semester) {
      return NextResponse.json(
        { error: "Your account needs a semester before assignment files can be shown." },
        { status: 403 },
      );
    }

    const { assignmentId, fileId } = await context.params;
    if (!ObjectId.isValid(assignmentId) || !ObjectId.isValid(fileId)) {
      return NextResponse.json({ error: "Assignment file was not found." }, { status: 404 });
    }

    const database = await getDatabase();
    const assignment = await database.collection("assignments").findOne({
      _id: new ObjectId(assignmentId),
      ...(user.role === "teacher"
        ? { teacherId: user.id }
        : { published: true, semester: user.semester }),
      files: { $elemMatch: { id: fileId } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment file was not found." }, { status: 404 });
    }

    const bucket = await getUploadsBucket();
    const file = (await bucket.find({ _id: new ObjectId(fileId) }).next()) as GridFSFile | null;
    if (!file) {
      return NextResponse.json({ error: "Assignment file was not found." }, { status: 404 });
    }

    const storedContentType =
      typeof file.metadata?.contentType === "string" ? file.metadata.contentType : "";
    const contentType = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
      storedContentType,
    )
      ? storedContentType
      : "application/octet-stream";
    const stream = bucket.openDownloadStream(file._id);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        "Content-Length": String(file.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
