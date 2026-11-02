import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { campusFeatureTypes } from "@/lib/campus-features";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const createEntrySchema = z.object({
  type: z.enum(campusFeatureTypes),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(4).max(4000),
  subject: z.string().trim().max(100).optional(),
  semester: z.number().int().min(1).max(8).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  dueAt: z.string().datetime().optional(),
  options: z.array(z.string().trim().min(1).max(180)).max(8).default([]),
  correctIndex: z.number().int().min(0).optional(),
  anonymous: z.boolean().default(false),
}).superRefine((entry, context) => {
  if (
    ["notes-exchange", "verified-resources", "lab-repository"].includes(entry.type) &&
    (!entry.subject || !entry.semester)
  ) {
    context.addIssue({
      code: "custom",
      message: "Add the subject and semester for this resource.",
      path: ["subject"],
    });
  }
  if (entry.type === "campus-polls" && entry.options.length < 2) {
    context.addIssue({
      code: "custom",
      message: "A poll needs at least two answer choices.",
      path: ["options"],
    });
  }
  if (entry.type === "question-bank" && entry.options.length > 0) {
    if (entry.options.length < 2 || entry.correctIndex === undefined) {
      context.addIssue({
        code: "custom",
        message: "A practice question needs at least two choices and a correct answer.",
        path: ["options"],
      });
    } else if (entry.correctIndex >= entry.options.length) {
      context.addIssue({
        code: "custom",
        message: "Choose a correct answer from the listed choices.",
        path: ["correctIndex"],
      });
    }
  }
  if (entry.type === "doubt-box" && !entry.anonymous) {
    context.addIssue({
      code: "custom",
      message: "Doubts are anonymous to other students.",
      path: ["anonymous"],
    });
  }
});

function serialize(document: Record<string, unknown>, userId?: string) {
  const votes = Array.isArray(document.votes) ? document.votes : [];
  const ratings = Array.isArray(document.ratings) ? document.ratings : [];
  const bookmarks = Array.isArray(document.bookmarks) ? document.bookmarks : [];
  const helpfulBy = Array.isArray(document.helpfulBy) ? document.helpfulBy : [];
  const interestedBy = Array.isArray(document.interestedBy) ? document.interestedBy : [];
  const file = document.file && typeof document.file === "object"
    ? document.file as Record<string, unknown>
    : undefined;

  return {
    id: String(document._id),
    type: document.type,
    title: String(document.title),
    body: String(document.body),
    subject: typeof document.subject === "string" ? document.subject : undefined,
    semester: typeof document.semester === "number" ? document.semester : undefined,
    tags: Array.isArray(document.tags) ? document.tags : [],
    dueAt: document.dueAt instanceof Date ? document.dueAt.toISOString() : undefined,
    options: Array.isArray(document.options) ? document.options : [],
    authorName: document.anonymous === true ? "Anonymous student" : String(document.authorName),
    authorRole: document.authorRole,
    anonymous: document.anonymous === true,
    verified: document.verified === true,
    createdAt: new Date(document.createdAt as Date).toISOString(),
    bookmarked: userId ? bookmarks.includes(userId) : false,
    rating: ratings.length
      ? ratings.reduce((sum: number, rating: { value: number }) => sum + rating.value, 0) / ratings.length
      : undefined,
    votes: document.type === "campus-polls" && userId &&
      votes.some((vote: { userId: string }) => vote.userId === userId)
      ? (document.options as string[]).map((_, index) =>
          votes.filter((vote: { option: number }) => vote.option === index).length,
        )
      : undefined,
    userVote: userId
      ? votes.find((vote: { userId: string; option: number }) => vote.userId === userId)?.option
      : undefined,
    helpfulCount: helpfulBy.length,
    interestedCount: interestedBy.length,
    userInterested: userId ? interestedBy.includes(userId) : false,
    completed: userId
      ? Array.isArray(document.completedBy) && document.completedBy.includes(userId)
      : false,
    file: file
      ? {
          id: String(file.id),
          name: String(file.name),
          contentType: String(file.contentType),
          size: Number(file.size),
        }
      : undefined,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    const typeResult = typeParam ? z.enum(campusFeatureTypes).safeParse(typeParam) : undefined;
    if (typeResult && !typeResult.success) {
      return NextResponse.json({ error: "Choose a valid feature." }, { status: 400 });
    }

    const semester = url.searchParams.get("semester");
    const semesterNumber = semester ? Number(semester) : undefined;
    if (semesterNumber !== undefined && (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8)) {
      return NextResponse.json({ error: "Choose a semester from 1 to 8." }, { status: 400 });
    }

    const search = url.searchParams.get("q")?.trim().slice(0, 100);
    const filter: Record<string, unknown> = {};
    if (typeResult?.success) {
      if (typeResult.data === "notes-of-week") {
        filter.type = "notes-exchange";
      } else if (typeResult.data === "smart-search") {
        filter.type = { $in: ["notes-exchange", "lab-repository", "question-bank", "verified-resources"] };
      } else if (typeResult.data === "verified-resources") {
        filter.type = { $in: ["notes-exchange", "lab-repository", "question-bank", "verified-resources"] };
      } else {
        filter.type = typeResult.data;
      }
    }
    const user = await getSessionUser();
    if (typeResult?.success && typeResult.data === "verified-resources" && user?.role !== "teacher") {
      filter.verified = true;
    }
    if (typeResult?.success && typeResult.data === "notes-of-week") {
      filter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }
    if (semesterNumber) filter.semester = semesterNumber;
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { body: { $regex: safeSearch, $options: "i" } },
        { subject: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const documents = await (await getDatabase())
      .collection("campus_hub_entries")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({ entries: documents.map((document) => serialize(document, user?.id)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to share something with the hub." }, { status: 401 });
    }

    const parsed = createEntrySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Check the post details." },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const document = {
      ...input,
      ...(input.dueAt ? { dueAt: new Date(input.dueAt) } : {}),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      anonymous: input.type === "doubt-box",
      verified: false,
      votes: [],
      bookmarks: [],
      ratings: [],
      helpfulBy: [],
      interestedBy: [],
      completedBy: [],
      createdAt: new Date(),
    };
    const collection = (await getDatabase()).collection("campus_hub_entries");
    const result = await collection.insertOne(document);
    return NextResponse.json(
      { entry: serialize({ ...document, _id: result.insertedId }, user.id) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
