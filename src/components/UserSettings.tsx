"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createRef,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import { authClient } from "@/lib/auth-client";

import { Button } from "./lib/Button";

export function UserSettings({
  setUserModalOpen,
}: {
  setUserModalOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const session = authClient.useSession();
  const [name, setName] = useState(session.data?.user.name);
  const [email, setEmail] = useState(session.data?.user.email);
  const [avatar, setAvatar] = useState<FileList | null>(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const avatarRef = createRef<HTMLInputElement>();

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (avatarRef.current) {
      const dt = new DataTransfer();
      for (const f of avatar || []) {
        dt.items.add(f);
      }
      avatarRef.current.files = dt.files;
    }
  }, [avatar, avatarRef]);

  useEffect(() => {
    const to = setTimeout(() => {
      setNameError("");
      setEmailError("");
      setAvatarError("");
      setPasswordError("");
    }, 10000);
    return () => clearTimeout(to);
  }, [nameError, emailError, avatarError, passwordError]);

  if (session.isPending) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setUserModalOpen(false)}
      />
      <div className="bg-ctp-surface1 border-ctp-overlay2 z-70 h-fit w-[min(720px,92vw)] gap-4 rounded border p-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-ctp-text text-lg font-bold">User Settings</h2>
            <button
              className="text-ctp-text2 cursor-pointer"
              onClick={() => setUserModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="bg-ctp-surface0 grid max-w-full grid-cols-[25%_55%_20%] gap-y-3 rounded-lg p-2">
          <label className="text-ctp-subtext0 font-semibold" htmlFor="name">
            Name
          </label>
          <input
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="name"
            onChange={(e) => setName(e.target.value)}
            type="text"
            value={name}
          />
          <button
            className="text-ctp-text max-w-full cursor-pointer disabled:cursor-not-allowed"
            disabled={session.data?.user.name === name}
            onClick={() => {
              if (name === session.data?.user.name || !name) return;
              authClient.updateUser(
                { name },
                {
                  onError: (error) => {
                    console.warn(error.error);
                    setNameError(error.error.message);
                  },
                },
              );
            }}
          >
            Save
          </button>
          <p className="text-ctp-red col-span-3">{nameError}</p>
          <label className="text-ctp-subtext0 font-semibold" htmlFor="email">
            Email
          </label>
          <input
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            value={email}
          />
          <button
            className="text-ctp-text max-w-full cursor-pointer disabled:cursor-not-allowed"
            disabled={session.data?.user.email === email}
            onClick={() => {
              if (email === session.data?.user.email || !email) return;
              authClient.changeEmail(
                { newEmail: email },
                {
                  onError: (error) => {
                    console.warn(error);
                    setEmailError(error.error.message);
                  },
                },
              );
            }}
          >
            Save
          </button>
          <p className="text-ctp-red col-span-3">{emailError}</p>
          <div className="flex justify-between pr-5">
            <label className="text-ctp-subtext0 font-semibold" htmlFor="avatar">
              Avatar
            </label>
            <Image
              alt="User Avatar"
              className="h-8.5 w-8.5 rounded-full"
              height={34}
              src={
                avatar
                  ? URL.createObjectURL(avatar[0])
                  : (session.data?.user.image ?? "/icon.svg")
              }
              width={34}
            />
          </div>
          <input
            accept="image/*"
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="avatar"
            onChange={(e) => setAvatar(e.target.files)}
            type="file"
          />
          <button
            className="text-ctp-text not-disabled:bg-ctp-green not-disabled:text-ctp-base max-w-full cursor-pointer disabled:cursor-not-allowed"
            disabled={!avatar?.length}
            onClick={async () => {
              if (!avatar) return;
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(avatar[0]);
              });
              authClient.updateUser(
                { image: base64 },
                {
                  onError: (error) => {
                    console.warn(error.error);
                    setAvatarError(error.error.message);
                  },
                },
              );
              setAvatar(null);
            }}
          >
            Save
          </button>
          <p className="text-ctp-red col-span-3">{avatarError}</p>
          <h2 className="text-ctp-subtext0 border-b-ctp-overlay2 col-span-3 w-full border-b font-semibold">
            Change Password
          </h2>
          <label
            className="text-ctp-subtext0 font-semibold"
            htmlFor="oldPassword"
          >
            Old Password
          </label>
          <input
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="oldPassword"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            value={password}
          />
          <div />
          <label
            className="text-ctp-subtext0 font-semibold"
            htmlFor="newPassword"
          >
            New Password
          </label>
          <input
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="newPassword"
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            value={newPassword}
          />
          <div />
          <label
            className="text-ctp-subtext0 font-semibold"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <input
            className="text-ctp-text border-ctp-overlay2 rounded border px-2 py-1"
            id="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            value={confirmPassword}
          />
          <button
            className="text-ctp-text max-w-full cursor-pointer disabled:cursor-not-allowed"
            disabled={
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              !password
            }
            onClick={() => {
              if (
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              )
                return;
              authClient
                .changePassword(
                  {
                    currentPassword: password,
                    newPassword,
                  },
                  {
                    onError: (error) => {
                      console.warn(error.error);
                      setPasswordError(error.error.message);
                    },
                  },
                )
                .finally(() => {
                  setPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                });
            }}
          >
            Save
          </button>
          <p className="text-ctp-red col-span-3">{passwordError}</p>
          <div className="col-start-3 mt-4 flex w-full justify-end">
            <Button
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/");
                    },
                  },
                })
              }
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
