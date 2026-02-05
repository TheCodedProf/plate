import db from "@db";
import { calendars as calendarDb } from "@db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calendars = await db.query.calendars.findMany({
    where: (calendar, { eq }) => eq(calendar.userId, session.user.id),
  });

  if (calendars.length === 0) {
    return NextResponse.json(
      await db
        .insert(calendarDb)
        .values({
          color: "lavender",
          default: true,
          name: "Default calendar",
          userId: session.user.id,
        })
        .returning(),
    );
  }

  return NextResponse.json(calendars);
}
