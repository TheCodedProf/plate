"use client";
import { useEffect, useRef } from "react";

import { calendarEvents, settings as settingsDb } from "@/lib/db";

import { Button } from "../lib/Button";
import { CalendarEvent } from "../lib/CalendarEvent";
import { formatTime } from "../lib/time";

export function DaySummary({
  openModal,
  selectedEvents,
  settings,
  view,
}: {
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
  selectedEvents: (CalendarEvent & { color: string })[];
  settings: typeof settingsDb.$inferSelect;
  view: Date;
}) {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const getFormattedDate = () => {
    if (!mounted) return null;

    return view.toLocaleDateString("default", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="no-scrollbar h-full w-full overflow-y-scroll overscroll-none">
      <div className="bg-ctp-base sticky top-0 mb-2 flex h-10 items-center justify-between pb-2 text-sm font-semibold">
        <div className="text-ctp-text h-[2lh]">
          Events on {mounted ? <p>{getFormattedDate()}</p> : <DateSkeleton />}
        </div>
        <Button onClick={() => openModal()}>Add Event</Button>
      </div>

      {selectedEvents.length === 0 ? (
        <button
          className="border-ctp-overlay2 text-ctp-text w-full cursor-pointer rounded border border-dashed p-4 text-sm"
          onClick={() => openModal()}
        >
          No events for this day. Create one?
        </button>
      ) : (
        <div className="space-y-2">
          {selectedEvents.map((e, i) => (
            <button
              className="border-ctp-overlay2 text-ctp-text group flex w-full cursor-pointer flex-col rounded border p-3"
              key={`${view}-${i}-${e.title}`}
              onClick={() => openModal(e)}
            >
              <div className="grid w-full grid-cols-5 items-start justify-between gap-2 text-left">
                <div className="col-span-3 flex items-center gap-1">
                  <div
                    className={`min-h-2 min-w-2 rounded-full bg-ctp-${e.color}`}
                  ></div>
                  <p className="truncate font-semibold group-hover:underline">
                    {e.title}
                  </p>
                </div>
                <div className="text-ctp-subtext1 col-span-2 text-right text-xs">
                  {formatTime(e, view, settings.timeFormat)}
                </div>
              </div>

              {(e.location || e.notes) && (
                <div className="mt-2 space-y-1 text-left">
                  {e.location ? (
                    <div className="text-ctp-subtext1 text-xs">
                      📍 {e.location}
                    </div>
                  ) : null}
                  {e.notes ? (
                    <div className="text-ctp-subtext1 text-xs">{e.notes}</div>
                  ) : null}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateSkeleton() {
  return <p className="bg-ctp-surface1 h-4 w-24 animate-pulse rounded"></p>;
}
