import { auth } from "@/lib/auth";
import db, { users, calendarEvents } from "@db";
import { and, eq, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { truncDate } from "@/components/lib/time";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const normalStart = truncDate(new Date(searchParams.get("start") ?? 0));

  const halfEnd = truncDate(new Date(searchParams.get("end") ?? 0));
  const normalEnd = searchParams.has("end")
    ? new Date(halfEnd.getFullYear(), halfEnd.getMonth(), halfEnd.getDate() + 1)
    : new Date(5760, 9, 13, 0, 0, 0);

  const events = await db.query.users.findFirst({
    with: {
      calendars: {
        with: {
          events: {
            where: and(
              gte(calendarEvents.start, normalStart),
              lte(calendarEvents.end, normalEnd),
            ),
          },
        },
      },
    },
    where: eq(users.id, session.user.id),
  });

  return NextResponse.json(
    events?.calendars
      .map((calendar) =>
        calendar.events.map((event) => ({ ...event, color: calendar.color })),
      )
      .flat() ?? [],
  );
}
