"use client";
import { useEffect, useRef } from "react";
import { Button } from "../lib/Button";
import { CalendarEvent } from "../lib/CalendarEvent";
import { formatTime } from "../lib/time";
import { calendarEvents } from "@/lib/db";

function DateSkeleton() {
  return <p className="w-24 h-4 bg-ctp-surface1 rounded animate-pulse"></p>;
}

export function DaySummary({
  selectedEvents,
  view,
  openModal,
}: {
  selectedEvents: (CalendarEvent & { color: string })[];
  view: Date;
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
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
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="w-full h-full overflow-y-scroll overscroll-none no-scrollbar">
      <div className="mb-2 text-sm font-semibold sticky top-0 bg-ctp-base flex justify-between items-center pb-2 h-10">
        <div className="text-ctp-text h-[2lh]">
          Events on {mounted ? <p>{getFormattedDate()}</p> : <DateSkeleton />}
        </div>
        <Button onClick={() => openModal()}>Add Event</Button>
      </div>

      {selectedEvents.length === 0 ? (
        <button
          onClick={() => openModal()}
          className="rounded border border-dashed border-ctp-overlay2 p-4 text-sm text-ctp-text cursor-pointer w-full"
        >
          No events for this day. Create one?
        </button>
      ) : (
        <div className="space-y-2">
          {selectedEvents.map((e, i) => (
            <button
              key={`${view}-${i}-${e.title}`}
              className="rounded border border-ctp-overlay2 p-3 text-ctp-text cursor-pointer flex flex-col w-full group"
              onClick={() => openModal(e)}
            >
              <div className="grid grid-cols-3 items-start justify-between gap-2 w-full text-left">
                <div className="col-span-2 flex items-center gap-1">
                  <div
                    className={`rounded-full w-2 h-2 bg-ctp-${e.color}`}
                  ></div>
                  <p className="font-semibold group-hover:underline">
                    {e.title}
                  </p>
                </div>
                <div className="text-xs text-ctp-subtext1 text-right">
                  {formatTime(e, view)}
                </div>
              </div>

              {(e.location || e.notes) && (
                <div className="mt-2 space-y-1 text-left">
                  {e.location ? (
                    <div className="text-xs text-ctp-subtext1">
                      📍 {e.location}
                    </div>
                  ) : null}
                  {e.notes ? (
                    <div className="text-xs text-ctp-subtext1">{e.notes}</div>
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
