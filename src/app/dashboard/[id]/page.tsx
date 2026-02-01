"use client";
import { CalendarWidget } from "@/components/Calendar";
import { settings as settingsModel } from "@db";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Loading() {
  return (
    <>
      <div>Loading...</div>
    </>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full w-full grid-cols-[repeat(auto-fill,144px)] grid-rows-[repeat(auto-fill,144px)] [@media(min-width:2560px)]:grid-cols-[repeat(auto-fill,288px)] [@media(min-width:2560px)]:grid-rows-[repeat(auto-fill,288px)] p-2 gap-2 bg-ctp-base overflow-scroll">
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [settings, setSettings] = useState<
    typeof settingsModel.$inferSelect | null
  >(null);
  const params = useParams().id; // For dashboard ID, rn we only have one per user, eventually multiple
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      const response = await fetch(`/api/settings`);
      const data = await response.json();
      setSettings(data);
    }
    void fetchSettings();
  }, []);

  if (!params) {
    router.push("/dashboard/main"); // If the proxy breaks for whatever reason
    return null;
  }

  return (
    <div className="w-screen max-h-screen h-screen">
      <main className="h-full w-full">
        <Suspense fallback={<Loading />}>
          <Container>
            <CalendarWidget settings={settings!}></CalendarWidget>
          </Container>
        </Suspense>
      </main>
    </div>
  );
}
