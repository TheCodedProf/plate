"use server";
import db, { settings as settingsDb } from "@db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "./auth";

export const updateSettings = async (
  settings: typeof settingsDb.$inferSelect,
) => {
  try {
    return (
      await db
        .update(settingsDb)
        .set(settings)
        .where(eq(settingsDb.id, settings.id))
        .returning()
    )[0];
  } catch (e) {
    throw new Error(`Failed to update settings: ${e}`);
  }
};

export const getSettings = async () => {
  try {
    const userId = await auth.api
      .getSession({
        headers: await headers(),
      })
      .then((session) => session?.user.id);
    if (!userId) throw new Error("User not authenticated");
    let settings = (
      await db.select().from(settingsDb).where(eq(settingsDb.userId, userId))
    )[0];
    if (!settings) {
      settings = (
        await db.insert(settingsDb).values({ userId }).returning()
      )[0];
    }
    return settings;
  } catch (e) {
    throw new Error(`Failed to get settings: ${e}`);
  }
};
