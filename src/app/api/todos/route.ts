import { auth } from "@/lib/auth";
import db, { todos } from "@db";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.todos.findMany({
    where: eq(todos.userId, session.user.id),
    orderBy: [desc(todos.dueDate)],
  });

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const title = String(body?.title ?? "").trim();
  const description =
    body?.description != null ? String(body.description).trim() : null;

  // Allow null/undefined. Accept ISO string or Date-ish
  const dueDate =
    body?.dueDate != null && String(body.dueDate).trim() !== ""
      ? new Date(body.dueDate)
      : null;

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const [created] = await db
    .insert(todos)
    .values({
      title,
      description,
      dueDate,
      completed: false,
      userId: session.user.id,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
