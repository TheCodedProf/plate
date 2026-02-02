"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [error, setError] = useState<null | string>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    await authClient.signIn.email(
      {
        callbackURL: "/dashboard",
        email,
        password,
      },
      {
        onError: (error) => {
          console.warn(error.error);
          setError(error.error.message);
        },
      },
    );
  };

  return (
    <>
      <div className="bg-ctp-base text-ctp-text grid h-screen grid-cols-2">
        <div />
        <div className="flex items-center justify-center">
          <form
            className="bg-ctp-surface0 mx-40 flex flex-col gap-6 rounded-lg px-8 py-12"
            onSubmit={handleLogin}
          >
            <p className="-mb-8 text-center text-2xl font-bold">Login</p>
            <label className="text-ctp-subtext0 flex flex-col gap-2 text-xs">
              Email:
              <input
                className="border-ctp-overlay2 rounded-md border px-2 py-1 text-lg"
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="text-ctp-subtext0 flex flex-col gap-2 text-xs">
              Password:
              <input
                className="border-ctp-overlay2 rounded-md border px-2 py-1 text-lg"
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {error && <p className="text-ctp-red">{error}</p>}
            <div className="flex flex-col gap-2">
              <button
                className="bg-ctp-green-600 text-ctp-surface0 cursor-pointer rounded-md px-2 py-1 text-lg font-bold"
                type="submit"
              >
                Login
              </button>
              <button
                className="bg-ctp-overlay0 text-ctp-surface0 cursor-pointer rounded-md px-2 py-1 text-lg font-bold"
                onClick={() => router.push("/auth/signup")}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
