"use client";

import { useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Button } from "../lib/Button";
import DayView from "./DayView";
import MonthView from "./MonthView";
import WeekView, { getWeek } from "./WeekView";
import {
  calendars as calendarModel,
  calendarEvents as eventModel,
  settings,
} from "@/lib/db";
import { EventModal } from "./EventModal";
import { CalendarModal } from "./CalendarModal";

interface Props {
  initialMonth?: Date;
  settings: typeof settings.$inferSelect;
}

export function toLocalDateTimeValue(d: Date) {
  // yyyy-MM-ddTHH:mm (local)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalDateTimeValue(v: string): Date {
  // v like "2026-02-02T09:30"
  return new Date(v);
}

function DateSkeleton() {
  return <div className="w-32 h-6 bg-ctp-surface1 rounded animate-pulse"></div>;
}

export function CalendarWidget({ initialMonth, settings }: Props) {
  const [view, setView] = useState<Date>(initialMonth ?? new Date());
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month">(
    "month",
  );
  const [update, setUpdate] = useState(false);
  const [events, setEvents] = useState<
    (typeof eventModel.$inferSelect & { color: string })[]
  >([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setEvents(data);
      });
  }, [update]);

  // keep a local copy so edits reflect instantly in UI
  const [localEvents, setLocalEvents] =
    useState<(typeof eventModel.$inferSelect & { color: string })[]>(events);
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const [calendars, setCalendars] = useState<
    (typeof calendarModel.$inferSelect)[]
  >([]);
  useEffect(() => {
    setTimeout(() => {
      fetch("/api/calendars")
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setCalendars(data);
        });
    }, 1000);
  }, [showCalendar]);

  // Selection + Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [eventData, setEventData] = useState<Partial<
    typeof eventModel.$inferInsert
  > | null>(null);
  useEffect(() => {
    if (!editorOpen) {
      setEventData(null);
    }
  }, [setEventData, editorOpen]);

  function openModal(initialEvent?: Partial<typeof eventModel.$inferInsert>) {
    if (!initialEvent) {
      setEventData(null);
    } else {
      if (initialEvent.id) {
        setEventData(localEvents.find((e) => e.id === initialEvent.id) ?? null);
      } else {
        setEventData(initialEvent);
      }
    }
    setEditorOpen(true);
  }

  const getViewDisplayText = () => {
    if (!mounted) return null;

    if (selectedView === "day") {
      return view.toLocaleDateString();
    } else if (selectedView === "week") {
      return `CW: ${getWeek(view) % 52}`;
    } else if (selectedView === "month") {
      return view.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      });
    }
    return "";
  };

  return (
    <div className="border-2 rounded border-ctp-overlay2 col-span-8 row-span-4 flex flex-col items-center gap-1">
      <div className="grid grid-cols-3 items-center w-full h-fit m-1">
        <div className="flex items-center gap-2 w-full h-12 pl-4">
          <Button onClick={() => prev(setView, selectedView)}>&lt;</Button>
          <Button onClick={() => today(setView)}>&#128197;</Button>
          <Button onClick={() => next(setView, selectedView)}>&gt;</Button>
          <Button onClick={() => setShowCalendar(true)}>New Calendar</Button>
        </div>

        <div className="w-full text-ctp-text text-center">
          {mounted ? getViewDisplayText() : <DateSkeleton />}
        </div>
        <div className="rounded-full border border-ctp-surface1 bg-ctp-surface0 w-50 h-8 flex justify-between items-center text-ctp-text justify-self-end mr-4">
          <button
            className={
              "rounded-full h-7 text-center cursor-pointer px-2" +
              (selectedView === "day"
                ? " bg-ctp-surface1 outline-ctp-surface2 outline-2"
                : "")
            }
            onClick={() => setSelectedView("day")}
          >
            Day
          </button>
          <button
            className={
              "rounded-full h-7 text-center cursor-pointer px-2" +
              (selectedView === "week"
                ? " bg-ctp-surface1 outline-ctp-surface2 outline-2"
                : "")
            }
            onClick={() => setSelectedView("week")}
          >
            Week
          </button>
          <button
            className={
              "rounded-full h-7 text-center cursor-pointer px-2" +
              (selectedView === "month"
                ? " bg-ctp-surface1 outline-ctp-surface2 outline-2"
                : "")
            }
            onClick={() => setSelectedView("month")}
          >
            Month
          </button>
        </div>
      </div>

      <div className="h-0 w-9/10 border-t border-t-ctp-overlay2 bg-none"></div>

      <div className="h-full w-full overflow-hidden">
        {selectedView === "day" ? (
          <DayView
            events={localEvents}
            view={view}
            settings={settings}
            openModal={openModal}
          />
        ) : selectedView === "week" ? (
          <WeekView
            events={localEvents}
            settings={settings}
            view={view}
            setView={setView}
            openModal={openModal}
          />
        ) : (
          <MonthView
            events={localEvents}
            settings={settings}
            view={view}
            setView={setView}
            openModal={openModal}
          />
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen ? (
        <EventModal
          setEditorOpen={setEditorOpen}
          calendars={calendars}
          view={view}
          setUpdate={setUpdate}
          setLocalEvents={setLocalEvents}
          initialEvent={eventData ?? undefined}
        />
      ) : null}

      {showCalendar ? <CalendarModal setModalOpen={setShowCalendar} /> : null}
    </div>
  );
}

function prev(setView: Dispatch<SetStateAction<Date>>, selectedView: string) {
  switch (selectedView) {
    case "day":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
      break;
    case "week":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
      break;
    case "month":
      setView((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      break;
  }
}

function next(setView: Dispatch<SetStateAction<Date>>, selectedView: string) {
  switch (selectedView) {
    case "day":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
      break;
    case "week":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
      break;
    case "month":
      setView((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      break;
  }
}

function today(setView: Dispatch<SetStateAction<Date>>) {
  setView(new Date());
}
