"use client";
import { settings as settingsModel } from "@db";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";

import { CalendarWidget } from "@/components/Calendar";
import TodoWidget from "@/components/Todo/TodoWidget";
import { UserSettings } from "@/components/UserSettings";
import { authClient } from "@/lib/auth-client";
import { getSettings } from "@/lib/settingsDb";

export default function DashboardPage() {
  const [settings, setSettings] = useState<
    null | typeof settingsModel.$inferSelect
  >(null);
  const id = useParams().id; // For dashboard ID, rn we only have one per user, eventually multiple
  const router = useRouter();
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);

  const session = authClient.useSession();

  useEffect(() => {
    getSettings().then((set) => {
      setSettings(set);
    });
  }, []);

  if (!id) {
    router.push("/dashboard/main"); // If the proxy breaks for whatever reason
    return null;
  }

  return (
    <main className="h-full max-h-screen min-h-screen w-full overflow-hidden">
      {session.isPending ? (
        <></>
      ) : (
        <Image
          alt="User Avatar"
          className="fixed top-2 right-2 h-12 w-12 cursor-pointer rounded-full"
          height={48}
          onClick={() => {
            setShowUserSettingsModal(true);
          }}
          src={session.data?.user.image ?? "/icon.svg"}
          width={48}
        />
      )}
      <Suspense fallback={<Loading />}>
        {/*<Settings />*/}
        {settings && (
          <DashboardGrid>
            {Container(
              8,
              5,
              <CalendarWidget
                setSettings={setSettings}
                settings={settings!}
              ></CalendarWidget>,
            )}
            {Container(
              3,
              3,
              <TodoWidget
                setSettings={setSettings}
                settings={settings!}
              ></TodoWidget>,
            )}
          </DashboardGrid>
        )}
        {showUserSettingsModal && (
          <UserSettings setUserModalOpen={setShowUserSettingsModal} />
        )}
      </Suspense>
    </main>
  );
}

function Container(w: number, h: number, content: ReactNode): ReactNode {
  return (
    <div
      style={{
        gridColumnEnd: "span " + w,
        gridColumnStart: "auto",
        gridRowEnd: "span " + h,
        gridRowStart: "auto",
      }}
    >
      {content}
    </div>
  );
}

function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        //"" +
        "grid grid-flow-row grid-cols-[repeat(auto-fill,144px)] grid-rows-[repeat(auto-fit,144px)] " +
        "[@media(min-width:2560px)]:grid-cols-[repeat(auto-fill,192px)] [@media(min-width:2560px)]:grid-rows-[repeat(auto-fit,192px)] " +
        "[@media(min-width:3180px)]:grid-cols-[repeat(auto-fill,288px)] [@media(min-width:3180px)]:grid-rows-[repeat(auto-fit,288px)] " +
        "bg-ctp-base no-scrollbar min-h-screen max-w-full gap-2 overflow-scroll p-2"
      }
      //style={{ flexFlow: "row wrap" }}
    >
      {children}
    </div>
  );
}

function Loading() {
  return (
    <>
      <div>Loading...</div>
    </>
  );
}
