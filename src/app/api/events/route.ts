import db, { users } from "@db";
import { eq } from "drizzle-orm";
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

  const events = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
      calendars: {
        with: {
          events: true,
        },
      },
    },
  });

  return NextResponse.json(
    events?.calendars.flatMap((calendar) =>
      calendar.events.map((event) => ({ ...event, color: calendar.color })),
    ) ?? [],
  );
}
