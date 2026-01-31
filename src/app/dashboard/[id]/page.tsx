"use client";
import { CalendarWidget } from "@/components/Calendar";
import { settings as settingsModel } from "@db";
import { Suspense, useEffect, useState } from "react";

export default function DashboardPage({ params }: { params: { id: string } }) {
  const [settings, setSettings] = useState<
    typeof settingsModel.$inferSelect | null
  >(null);

  useEffect(() => {
    async function fetchSettings() {
      const response = await fetch(`/api/settings`);
      const data = await response.json();
      setSettings(data);
    }
    void fetchSettings();
  }, []);

  return (
    <div className="w-screen max-h-screen h-screen">
      <main className="grid h-full w-full grid-cols-[repeat(auto-fill,7.92%)] grid-rows-[repeat(auto-fill,15.95%)] p-2 gap-2 bg-ctp-base overflow-scroll">
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarWidget settings={settings!}></CalendarWidget>
        </Suspense>
      </main>
    </div>
  );
}
