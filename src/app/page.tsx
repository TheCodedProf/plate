"use client";
import { CalendarWidget } from "@/components/Calendar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ctp-mantle font-sans">
      <main className="flex min-h-screen w-full justify-between p-12 bg-ctp-base">
        {session?.session.token ? (
          <button onClick={async () => await authClient.signOut()}>
            Sign out
          </button>
        ) : (
          <button onClick={() => router.push("/auth/signin")}>Sign in</button>
        )}
      </main>
    </div>
  );
}
