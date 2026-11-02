import { NextResponse } from "next/server";

export function errorResponse(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes("MONGODB_URI") || error.message.includes("AUTH_SECRET"))
  ) {
    return NextResponse.json(
      { error: "The server is not configured yet. Add MongoDB and session settings to .env.local." },
      { status: 503 },
    );
  }

  console.error("API request failed:", error);
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
