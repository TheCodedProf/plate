import db, { todos } from "@db";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 },
    );
  }

  const [deleted] = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));

  const updates: Partial<typeof todos.$inferInsert> = {};

  if (body?.title != null) {
    const t = String(body.title).trim();
    if (!t)
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 },
      );
    updates.title = t;
  }

  if (body?.description !== undefined) {
    updates.description =
      body.description == null ? null : String(body.description).trim();
  }

  if (body?.dueDate !== undefined) {
    updates.dueDate =
      body.dueDate == null || String(body.dueDate).trim() === ""
        ? null
        : new Date(body.dueDate);
  }

  if (body?.completed !== undefined) {
    updates.completed = Boolean(body.completed);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const [updated] = await db
    .update(todos)
    .set(updates)
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
