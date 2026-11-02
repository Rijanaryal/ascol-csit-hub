import { ObjectId } from "mongodb";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { NextResponse } from "next/server";

const interactionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bookmark") }),
  z.object({ action: z.literal("rate"), value: z.number().int().min(1).max(5) }),
  z.object({ action: z.literal("vote"), option: z.number().int().min(0).max(7) }),
  z.object({ action: z.literal("helpful") }),
  z.object({ action: z.literal("interest") }),
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("verify") }),
  z.object({ action: z.literal("answer"), option: z.number().int().min(0).max(7) }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  try {
    const user = await getSessionUser();
    const { entryId } = await context.params;
    if (!ObjectId.isValid(entryId)) {
      return NextResponse.json({ error: "This post was not found." }, { status: 404 });
    }

    const parsed = interactionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid action." }, { status: 400 });
    }
    if (!user && parsed.data.action !== "answer") {
      return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 });
    }

    const collection = (await getDatabase()).collection("campus_hub_entries");
    const entry = await collection.findOne({ _id: new ObjectId(entryId) });
    if (!entry) {
      return NextResponse.json({ error: "This post was not found." }, { status: 404 });
    }

    const action = parsed.data;
    if (action.action === "answer") {
      if (entry.type !== "question-bank" || !Array.isArray(entry.options) || action.option >= entry.options.length) {
        return NextResponse.json({ error: "Choose an answer from this question." }, { status: 400 });
      }
      if (typeof entry.correctIndex !== "number") {
        return NextResponse.json({ error: "This question does not have a correct answer set." }, { status: 400 });
      }
      return NextResponse.json({
        correct: action.option === entry.correctIndex,
        explanation: String(entry.body),
      });
    }
    if (!user) {
      return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 });
    }
    const userId = user.id;

    let update: Record<string, unknown>;

    switch (action.action) {
      case "bookmark":
        update = {
          $pull: { bookmarks: userId },
        };
        if (!(entry.bookmarks as string[] | undefined)?.includes(userId)) {
          update = { $addToSet: { bookmarks: userId } };
        }
        break;
      case "rate": {
        const ratings = (entry.ratings as { userId: string; value: number }[] | undefined) ?? [];
        update = {
          $set: {
            ratings: [
              ...ratings.filter((rating) => rating.userId !== userId),
              { userId, value: action.value },
            ],
          },
        };
        break;
      }
      case "vote": {
        if (entry.type !== "campus-polls" || action.option >= (entry.options as string[]).length) {
          return NextResponse.json({ error: "Choose an option from this poll." }, { status: 400 });
        }
        const votes = (entry.votes as { userId: string; option: number }[] | undefined) ?? [];
        update = {
          $set: {
            votes: [
              ...votes.filter((vote) => vote.userId !== userId),
              { userId, option: action.option },
            ],
          },
        };
        break;
      }
      case "helpful":
        update = {
          $addToSet: { helpfulBy: userId },
        };
        if ((entry.helpfulBy as string[] | undefined)?.includes(userId)) {
          update = { $pull: { helpfulBy: userId } };
        }
        break;
      case "interest":
        update = { $addToSet: { interestedBy: userId } };
        if ((entry.interestedBy as string[] | undefined)?.includes(userId)) {
          update = { $pull: { interestedBy: userId } };
        }
        break;
      case "complete":
        update = { $addToSet: { completedBy: userId } };
        if ((entry.completedBy as string[] | undefined)?.includes(userId)) {
          update = { $pull: { completedBy: userId } };
        }
        break;
      case "verify":
        if (user.role !== "teacher") {
          return NextResponse.json(
            { error: "Only a teacher account can verify a resource." },
            { status: 403 },
          );
        }
        if (!["notes-exchange", "verified-resources", "lab-repository", "question-bank"].includes(entry.type)) {
          return NextResponse.json({ error: "This kind of post cannot be verified." }, { status: 400 });
        }
        update = entry.verified
          ? { $set: { verified: false }, $unset: { verifiedBy: "", verifiedAt: "" } }
          : { $set: { verified: true, verifiedBy: userId, verifiedAt: new Date() } };
        break;
    }

    await collection.updateOne({ _id: new ObjectId(entryId) }, update);
    const updated = await collection.findOne({ _id: new ObjectId(entryId) });
    return NextResponse.json({ entry: updated ? serialize(updated, userId) : null });
  } catch (error) {
    return errorResponse(error);
  }
}

function serialize(document: Record<string, unknown>, userId: string) {
  const votes = Array.isArray(document.votes) ? document.votes : [];
  const ratings = Array.isArray(document.ratings) ? document.ratings : [];
  const bookmarks = Array.isArray(document.bookmarks) ? document.bookmarks : [];
  const helpfulBy = Array.isArray(document.helpfulBy) ? document.helpfulBy : [];
  const interestedBy = Array.isArray(document.interestedBy) ? document.interestedBy : [];
  const completedBy = Array.isArray(document.completedBy) ? document.completedBy : [];
  const options = Array.isArray(document.options) ? document.options as string[] : [];

  return {
    id: String(document._id),
    type: document.type,
    title: String(document.title),
    body: String(document.body),
    subject: typeof document.subject === "string" ? document.subject : undefined,
    semester: typeof document.semester === "number" ? document.semester : undefined,
    tags: Array.isArray(document.tags) ? document.tags : [],
    dueAt: document.dueAt instanceof Date ? document.dueAt.toISOString() : undefined,
    options,
    authorName: document.anonymous === true ? "Anonymous student" : String(document.authorName),
    authorRole: document.authorRole,
    anonymous: document.anonymous === true,
    verified: document.verified === true,
    createdAt: new Date(document.createdAt as Date).toISOString(),
    bookmarked: bookmarks.includes(userId),
    rating: ratings.length
      ? ratings.reduce((sum: number, rating: { value: number }) => sum + rating.value, 0) / ratings.length
      : undefined,
    votes: document.type === "campus-polls" &&
      votes.some((vote: { userId: string }) => vote.userId === userId)
      ? options.map((_, index) =>
          votes.filter((vote: { option: number }) => vote.option === index).length,
        )
      : undefined,
    userVote: votes.find((vote: { userId: string; option: number }) => vote.userId === userId)?.option,
    helpfulCount: helpfulBy.length,
    interestedCount: interestedBy.length,
    userInterested: interestedBy.includes(userId),
    completed: completedBy.includes(userId),
    file: document.file && typeof document.file === "object"
      ? {
          id: String((document.file as Record<string, unknown>).id),
          name: String((document.file as Record<string, unknown>).name),
          contentType: String((document.file as Record<string, unknown>).contentType),
          size: Number((document.file as Record<string, unknown>).size),
        }
      : undefined,
  };
}
