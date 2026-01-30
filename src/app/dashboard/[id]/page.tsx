"use client";
import { CalendarWidget } from "@/components/Calendar";
import { authClient } from "@/lib/auth-client";
import { settings as settingsModel } from "@db";
import { Suspense, useEffect, useState } from "react";

export default function DashboardPage({ params }: { params: { id: string } }) {
  const session = authClient.useSession();
  const [settings, setSettings] = useState<
    typeof settingsModel.$inferSelect | null
  >(null);

  useEffect(() => {
    fetch(`/api/settings`)
      .then((res) => res.json())
      .then((data) => setSettings(data));
  }, []);

  return (
    <div>
      <main className="flex min-h-screen w-full justify-between p-12 bg-ctp-base">
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarWidget settings={settings!}></CalendarWidget>
        </Suspense>
      </main>
    </div>
  );
}
