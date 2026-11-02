import { ObjectId } from "mongodb";
import { getSessionUser } from "@/lib/auth";
import { getDatabase, getResourceFilesBucket } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";
import { finished } from "node:stream/promises";

export const runtime = "nodejs";

const maxFileSize = 20 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

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
    return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  let uploadedId: ObjectId | undefined;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to upload a resource." }, { status: 401 });
    }

    const { entryId } = await context.params;
    if (!ObjectId.isValid(entryId)) {
      return NextResponse.json({ error: "Resource post was not found." }, { status: 404 });
    }

    const collection = (await getDatabase()).collection("campus_hub_entries");
    const entry = await collection.findOne({
      _id: new ObjectId(entryId),
      authorId: user.id,
      type: { $in: ["notes-exchange", "lab-repository"] },
    });
    if (!entry) {
      return NextResponse.json({ error: "Resource post was not found." }, { status: 404 });
    }
    if (entry.file) {
      return NextResponse.json({ error: "This post already has a file attached." }, { status: 409 });
    }

    const requestLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(requestLength) && requestLength > maxFileSize + 256 * 1024) {
      return NextResponse.json({ error: "Files must be 20 MB or smaller." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a PDF or image to upload." }, { status: 400 });
    }
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "Files must be 20 MB or smaller." }, { status: 413 });
    }
    if (!allowedTypes.has(file.type) || !(await matchesFileType(file))) {
      return NextResponse.json(
        { error: "Only valid PDF, JPEG, PNG, or WebP files are allowed." },
        { status: 415 },
      );
    }

    const bucket = await getResourceFilesBucket();
    const safeName = file.name.replace(/[\\/\r\n"]/g, "_").slice(0, 180) || "study-resource";
    const upload = bucket.openUploadStream(safeName, {
      metadata: {
        entryId,
        uploadedBy: user.id,
        contentType: file.type,
      },
    });
    uploadedId = upload.id;
    upload.end(Buffer.from(await file.arrayBuffer()));
    await finished(upload);

    const storedFile = {
      id: upload.id.toString(),
      name: safeName,
      contentType: file.type,
      size: file.size,
    };
    const update = await collection.updateOne(
      { _id: entry._id, authorId: user.id, file: { $exists: false } },
      { $set: { file: storedFile } },
    );
    if (update.modifiedCount !== 1) {
      await bucket.delete(upload.id);
      return NextResponse.json(
        { error: "The file could not be attached to this post." },
        { status: 409 },
      );
    }
    return NextResponse.json({ file: storedFile }, { status: 201 });
  } catch (error) {
    if (uploadedId) {
      try {
        await (await getResourceFilesBucket()).delete(uploadedId);
      } catch (cleanupError) {
        console.error("Could not clean up incomplete resource upload:", cleanupError);
      }
    }
    return errorResponse(error);
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to access shared resources." }, { status: 401 });
    }
    const { entryId } = await context.params;
    if (!ObjectId.isValid(entryId)) {
      return NextResponse.json({ error: "Resource file was not found." }, { status: 404 });
    }

    const entry = await (await getDatabase()).collection("campus_hub_entries").findOne({
      _id: new ObjectId(entryId),
      "file.id": { $exists: true },
    });
    const fileId = entry?.file && typeof entry.file === "object"
      ? (entry.file as { id?: unknown }).id
      : undefined;
    if (typeof fileId !== "string" || !ObjectId.isValid(fileId)) {
      return NextResponse.json({ error: "Resource file was not found." }, { status: 404 });
    }

    const bucket = await getResourceFilesBucket();
    const file = await bucket.find({ _id: new ObjectId(fileId) }).next();
    if (!file) {
      return NextResponse.json({ error: "Resource file was not found." }, { status: 404 });
    }
    const contentType = typeof file.metadata?.contentType === "string" &&
      allowedTypes.has(file.metadata.contentType)
      ? file.metadata.contentType
      : "application/octet-stream";
    return new Response(
      (await import("node:stream")).Readable.toWeb(bucket.openDownloadStream(file._id)) as ReadableStream,
      {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
          "Content-Length": String(file.length),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
