"use server";
import { getSettings } from "@/lib/settingsDb";

// eventually use this for suspense boundary
export async function Settings() {
  await getSettings();

  return <></>;
}
