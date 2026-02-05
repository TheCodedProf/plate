"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRef, ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/lib/Button";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const session = authClient.useSession();
  return (
    <div className="bg-ctp-base flex min-h-screen flex-col items-center font-sans">
      <nav className="bg-ctp-mantle sticky top-0 z-10 flex min-h-max w-full justify-between gap-4 px-4 py-2">
        <div className="flex gap-4">
          <Link href="/">
            <h1 className="text-ctp-sky text-left text-4xl font-bold">Plate</h1>
          </Link>
        </div>
        <div className="flex gap-4">
          {session.data ? (
            <>
              <Button onClick={() => router.push("/dashboard")}>
                Open Dashboard
              </Button>
              <Button onClick={() => void (() => authClient.signOut())()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {authButton(router, "Sign In", "/auth/signin")}
              {authButton(router, "Sign Up", "/auth/signup")}
            </>
          )}
        </div>
      </nav>
      <div className="block p-4">
        <h1 className="text-ctp-blue block text-center text-7xl">Plate</h1>
        <h2 className="block text-center text-3xl">
          A clean time management tool.
        </h2>
      </div>
      <main className="bg-ctp-surface0 block h-full w-full max-w-6xl justify-between rounded p-6">
        {pageSection(
          "Features",
          <p className="text-ctp-text text-lg">
            Plate features a calendar with multiple display modes, a task
            management system, and a variety of configurable options.
          </p>,
        )}
        {pageSection(
          "Gallery",
          <SlideShow>
            <Image
              alt="Calendar Month View."
              fill={true}
              key="2"
              src="/month_view.png"
              style={{ objectFit: "contain" }}
            ></Image>
            <Image
              alt="Calendar Week View."
              fill={true}
              key="2"
              src="/week_view.png"
              style={{ objectFit: "contain" }}
            ></Image>
            <Image
              alt="Calendar Day View."
              fill={true}
              key="2"
              src="/alt_day_view.png"
              style={{ objectFit: "contain" }}
            ></Image>
            <Image
              alt="Todo widget."
              fill={true}
              key="2"
              src="/todo_widget.png"
              style={{ objectFit: "contain" }}
            ></Image>
          </SlideShow>,
        )}
      </main>
    </div>
  );
}

function authButton(
  r: AppRouterInstance,
  text: string,
  dest: string,
): ReactNode {
  return (
    <Button
      onClick={() => r.push(dest)}
      type={dest === "/auth/signup" ? "success" : undefined}
    >
      {text}
    </Button>
  );
}

function pageSection(title: string, content: ReactNode): ReactNode {
  return (
    <section className="border-ctp-base block min-h-max border-t-2 border-b-2 py-3">
      <h3 className="text-ctp-blue text-center text-2xl">{title}</h3>
      {content}
    </section>
  );
}

function SlideShow({ children }: { children: Array<ReactNode> }): ReactNode {
  const imageRefs = children.map(() => createRef<HTMLLIElement>());
  const containerRef = createRef<HTMLUListElement>();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const ref = imageRefs[activeIndex].current;
    if (ref && containerRef.current) {
      containerRef.current.scrollTo({
        behavior: "smooth",
        left: ref.offsetLeft,
      });
    }
  }, [imageRefs, activeIndex, containerRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % children.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [children]);

  return (
    <div className="flex justify-center">
      <Button
        onClick={() => {
          setActiveIndex(
            (prevIndex) => (prevIndex - 1 + children.length) % children.length,
          );
          console.log("Left Button");
        }}
      >
        {"<"}
      </Button>
      <ul
        className="no-scrollbar flex aspect-video h-full w-full justify-evenly gap-2 overflow-x-scroll scroll-smooth"
        ref={containerRef}
        style={{
          scrollSnapType: "x mandatory",
        }}
      >
        {children.map((c, i) => (
          <li
            className="relative h-full w-full list-none"
            key={"imglist-" + i}
            ref={imageRefs[i]}
            style={{
              flex: "0 0 100%",
              //backgroundColor: "#000000",
              scrollSnapAlign: "center",
            }}
          >
            {c}
          </li>
        ))}
      </ul>
      <Button
        onClick={() => {
          setActiveIndex((prevIndex) => (prevIndex + 1) % children.length);
          console.log("Right Button");
        }}
      >
        {">"}
      </Button>
    </div>
  );
}
