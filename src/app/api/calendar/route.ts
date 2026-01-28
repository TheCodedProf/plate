import { auth } from "@/lib/auth";
import db, { calendars } from "@db";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCalendars = await db.query.calendars.findMany({
    where: eq(calendars.userId, session.user.id),
  });

  return NextResponse.json(userCalendars);
}

export async function POST(request: Request) {
  const { name, description, color, default: isDefault } = await request.json();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const calendar = await db
    .insert(calendars)
    .values({
      name,
      description,
      userId: session.user.id,
      color,
      default: isDefault,
    })
    .returning();

  if (isDefault) {
    await db
      .update(calendars)
      .set({ default: false })
      .where(
        and(
          ne(calendars.id, calendar[0].id),
          eq(calendars.userId, session.user.id),
        ),
      );
  }

  return NextResponse.json(calendar[0]);
}

export async function PUT(request: Request) {
  const {
    id,
    name,
    description,
    color,
    default: isDefault,
  } = await request.json();

  if (!id || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const calendar = await db.query.calendars.findFirst({
    where: eq(calendars.id, id),
  });

  if (!calendar) {
    return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
  }

  if (!session || calendar.userId != session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDefault) {
    await db
      .update(calendars)
      .set({ default: false })
      .where(and(ne(calendars.id, id), eq(calendars.userId, session.user.id)));
  }

  const updated = await db
    .update(calendars)
    .set({ name, description, color, default: isDefault })
    .where(eq(calendars.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const calendar = await db.query.calendars.findFirst({
    where: eq(calendars.id, id),
  });

  if (!calendar) {
    return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
  }

  if (!session || calendar.userId != session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(calendars).where(eq(calendars.id, id));

  return NextResponse.json({ message: "Calendar deleted" });
}
