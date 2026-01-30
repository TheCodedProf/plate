import db, { settings as settingsDb } from "@db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, session.user.id),
  });

  if (!settings) {
    return NextResponse.json(
      (
        await db
          .insert(settingsDb)
          .values({
            userId: session.user.id,
          })
          .returning()
      )[0],
    );
  } else {
    return NextResponse.json(settings);
  }
}
