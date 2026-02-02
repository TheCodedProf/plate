import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import db, { calendarEvents } from "@/lib/database";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const calendarId = await db.query.calendarEvents.findFirst({
    columns: { calendarId: true },
    where: (event, { eq }) => eq(event.id, id),
  });

  if (!calendarId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const calendar = await db.query.calendars.findFirst({
    where: (calendar, { eq }) => eq(calendar.id, calendarId.calendarId),
  });

  if (!session || !calendar || session.user.id != calendar.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));

  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 },
    );
  }

  const event = await db.query.calendarEvents.findFirst({
    where: (event, { eq }) => eq(event.id, id),
    with: {
      calendar: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || event.calendar.userId != session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({});
}

export async function POST(request: Request) {
  const { allDay, calendarId, end, location, notes, start, title } =
    await request.json();

  if (!title || !start || !end || !calendarId) {
    console.log(title, start, end, calendarId);
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const calendar = await db.query.calendars.findFirst({
    where: (calendar, { eq }) => eq(calendar.id, calendarId),
  });

  if (!calendar) {
    return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
  }

  if (!session || session.user.id != calendar.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db
    .insert(calendarEvents)
    .values({
      allDay,
      calendarId,
      end: new Date(end),
      location,
      notes,
      start: new Date(start),
      title,
    })
    .returning();

  return NextResponse.json(event[0], { status: 201 });
}

export async function PUT(request: Request) {
  const { allDay, calendarId, end, id, location, notes, start, title } =
    await request.json();

  if (!id || !title || !start || !end || !calendarId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const calendar = await db.query.calendars.findFirst({
    where: (calendar, { eq }) => eq(calendar.id, calendarId),
  });

  if (!session || !calendar || session.user.id != calendar.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await db
    .update(calendarEvents)
    .set({
      allDay,
      calendarId,
      end: new Date(end),
      location,
      notes,
      start: new Date(start),
      title,
    })
    .where(eq(calendarEvents.id, id))
    .returning();

  return NextResponse.json(event[0], { status: 201 });
}
