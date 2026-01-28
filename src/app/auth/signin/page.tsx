"use client";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await authClient.signIn.email({
        email,
        password,
      });
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 h-screen bg-ctp-base text-ctp-text">
        <div />
        <div className="flex justify-center items-center">
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-12 mx-40 bg-ctp-surface0 rounded-lg px-8 py-12"
          >
            <p className="text-2xl font-bold text-center -mb-8">Login</p>
            <label className="flex flex-col gap-2 text-xs text-ctp-subtext0">
              Email:
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-ctp-overlay2 rounded-md px-2 py-1 text-lg"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-ctp-subtext0">
              Password:
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-ctp-overlay2 rounded-md px-2 py-1 text-lg"
              />
            </label>
            <div className="flex flex-col gap-2">
              <button
                className="rounded-md px-2 py-1 text-lg cursor-pointer bg-ctp-green-600 font-bold text-ctp-surface0"
                type="submit"
              >
                Login
              </button>
              <button
                className="rounded-md px-2 py-1 text-lg cursor-pointer bg-ctp-overlay0 font-bold text-ctp-surface0"
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
