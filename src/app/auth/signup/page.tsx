"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createRef, type FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFiles, setAvatarFiles] = useState<FileList | null>(null);
  const avatarRef = createRef<HTMLInputElement>();

  const router = useRouter();

  useEffect(() => {
    if (avatarRef.current) {
      const dt = new DataTransfer();
      for (const f of avatarFiles || []) {
        dt.items.add(f);
      }
      avatarRef.current.files = dt.files;
    }
  }, [avatarFiles, avatarRef]);

  const [error, setError] = useState<null | string>(null);

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    if (password != confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (avatarFiles) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(avatarFiles[0]);
      });
      await authClient.signUp.email(
        {
          callbackURL: "/dashboard",
          email,
          image: base64,
          name,
          password,
        },
        { onError: (error) => setError(error.error.message) },
      );
    } else {
      await authClient.signUp.email(
        {
          callbackURL: "/dashboard",
          email,
          name,
          password,
        },
        { onError: (error) => setError(error.error.message) },
      );
    }
  };

  return (
    <div className="bg-ctp-base text-ctp-text flex h-screen items-center justify-center">
      <div className="bg-ctp-surface0 flex flex-col items-center justify-center gap-6 rounded-lg px-8 py-12">
        <form className="flex flex-col gap-6" onSubmit={handleSignUp}>
          <p className="-mb-8 text-center text-2xl font-bold">Sign Up</p>
          <label className="text-ctp-subtext0 flex flex-col gap-2 text-xs">
            Name:
            <input
              className="border-ctp-overlay2 rounded-md border px-2 py-1 text-lg"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
            />
          </label>
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
            <div className="flex justify-between">
              <p>Avatar:</p>
              <Image
                alt="Avatar"
                className="h-16 w-16 rounded-full"
                height={64}
                src={
                  avatarFiles?.length
                    ? URL.createObjectURL(avatarFiles[0])
                    : "/icon.svg"
                }
                width={64}
              />
            </div>
            <input
              className="border-ctp-overlay2 rounded-md border px-2 py-1 text-lg"
              onChange={(e) => {
                if (e.target.files) {
                  setAvatarFiles(e.target.files);
                }
              }}
              ref={avatarRef}
              type="file"
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
          <label className="text-ctp-subtext0 flex flex-col gap-2 text-xs">
            Confirm Password:
            <input
              className="border-ctp-overlay2 rounded-md border px-2 py-1 text-lg"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          {error && <p className="text-ctp-red">{error}</p>}
          <button
            className="bg-ctp-green-600 text-ctp-surface0 cursor-pointer rounded-md px-2 py-1 text-lg font-bold"
            type="submit"
          >
            Sign Up
          </button>
        </form>
        <button
          className="bg-ctp-overlay0 text-ctp-surface0 w-full cursor-pointer rounded-md px-2 py-1 text-lg font-bold"
          onClick={() => router.push("/auth/signin")}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
