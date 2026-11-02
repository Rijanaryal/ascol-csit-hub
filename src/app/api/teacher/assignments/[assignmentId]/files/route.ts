import { ObjectId } from "mongodb";
import { getSessionUser } from "@/lib/auth";
import { getDatabase, getUploadsBucket } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";
import { finished } from "node:stream/promises";

export const runtime = "nodejs";

const maxFileSize = 50 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxFilesPerAssignment = 15;

type AssignmentFileRecord = {
  id: string;
  name: string;
  contentType: string;
  size: number;
};

type AssignmentStorageDocument = {
  _id: ObjectId;
  teacherId: string;
  files: AssignmentFileRecord[];
};

async function matchesFileType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "application/pdf") {
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }
  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === "image/png") {
    return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  }
  if (file.type === "image/webp") {
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  let uploadedId: ObjectId | undefined;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Teacher sign-in is required." }, { status: 401 });
    }

    const { assignmentId } = await context.params;
    if (!ObjectId.isValid(assignmentId)) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    const database = await getDatabase();
    const assignments =
      database.collection<AssignmentStorageDocument>("assignments");
    const assignment = await assignments.findOne({
      _id: new ObjectId(assignmentId),
      teacherId: user.id,
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a PDF or image to upload." }, { status: 400 });
    }
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "Each file must be 50 MB or smaller." }, { status: 413 });
    }
    if (!allowedTypes.has(file.type) || !(await matchesFileType(file))) {
      return NextResponse.json(
        { error: "Only valid PDF, JPEG, PNG, or WebP files are allowed." },
        { status: 415 },
      );
    }
    if (assignment.files.length >= maxFilesPerAssignment) {
      return NextResponse.json(
        { error: "An assignment can contain at most 15 files." },
        { status: 400 },
      );
    }

    const bucket = await getUploadsBucket();
    const safeName = file.name.replace(/[\\/\r\n"]/g, "_").slice(0, 180) || "assignment-file";
    const upload = bucket.openUploadStream(safeName, {
      metadata: {
        assignmentId,
        uploadedBy: user.id,
        contentType: file.type,
      },
    });
    uploadedId = upload.id;
    upload.end(Buffer.from(await file.arrayBuffer()));
    await finished(upload);

    const metadata = {
      id: upload.id.toString(),
      name: safeName,
      contentType: file.type,
      size: file.size,
    };
    const update = await assignments.updateOne(
      {
        _id: assignment._id,
        teacherId: user.id,
        files: { $size: assignment.files.length },
      },
      { $push: { files: metadata } },
    );
    if (update.modifiedCount !== 1) {
      await bucket.delete(upload.id);
      return NextResponse.json(
        { error: "The assignment file list could not be updated." },
        { status: 409 },
      );
    }

    return NextResponse.json({ file: metadata }, { status: 201 });
  } catch (error) {
    if (uploadedId) {
      try {
        await (await getUploadsBucket()).delete(uploadedId);
      } catch (cleanupError) {
        console.error("Could not clean up incomplete assignment upload:", cleanupError);
      }
    }
    return errorResponse(error);
  }
}
