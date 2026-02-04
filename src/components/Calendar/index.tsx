"use client";
// Needed for rendering DateTime in the correct TZ

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import {
  calendars as calendarModel,
  calendarEvents as eventModel,
  settings as settingsDb,
} from "@/lib/db";

import { Button } from "../lib/Button";
import { CalendarModal } from "./CalendarModal";
import { CalendarSettings } from "./CalendarSettingsModal";
import DayView from "./DayView";
import { EventModal } from "./EventModal";
import MonthView from "./MonthView";
import WeekView, { getWeek } from "./WeekView";

interface Props {
  initialMonth?: Date;
  setSettings: Dispatch<SetStateAction<null | typeof settingsDb.$inferSelect>>;
  settings: typeof settingsDb.$inferSelect;
}

const pickView = (
  viewMode: "day" | "month" | "week",
  view: Date,
  events: (typeof eventModel.$inferSelect & { color: string })[],
  openModal: (initialEvent?: Partial<typeof eventModel.$inferInsert>) => void,
  settings: typeof settingsDb.$inferSelect,
  setView: Dispatch<SetStateAction<Date>>,
) => {
  switch (viewMode) {
    case "day":
      return (
        <DayView
          events={events}
          openModal={openModal}
          settings={settings}
          view={view}
        />
      );
    case "week":
      return (
        <WeekView
          events={events}
          openModal={openModal}
          settings={settings}
          setView={setView}
          view={view}
        />
      );
    default:
      return (
        <MonthView
          events={events}
          openModal={openModal}
          settings={settings}
          setView={setView}
          view={view}
        />
      );
  }
};

export function CalendarWidget({ initialMonth, setSettings, settings }: Props) {
  const [view, setView] = useState<Date>(initialMonth ?? new Date());
  const [selectedView, setSelectedView] = useState<"day" | "month" | "week">(
    settings.defaultCalendarDisplay,
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
    setTimeout(() => {
      fetch("/api/events")
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setEvents(data);
        });
    }, 1000);
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

  // Selection + Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [eventData, setEventData] = useState<null | Partial<
    typeof eventModel.$inferInsert
  >>(null);
  useEffect(() => {
    if (!editorOpen) {
      setEventData(null);
    }
  }, [setEventData, editorOpen]);

  const [settingsOpen, setSettingsOpen] = useState(false);

  function openModal(initialEvent?: Partial<typeof eventModel.$inferInsert>) {
    if (initialEvent) {
      if (initialEvent.id) {
        setEventData(localEvents.find((e) => e.id === initialEvent.id) ?? null);
      } else {
        setEventData(initialEvent);
      }
    } else {
      setEventData(null);
    }
    setEditorOpen(true);
  }

  const getViewDisplayText = () => {
    if (!mounted) return null; //maybe assert this to error out

    switch (selectedView) {
      case "day": {
        return view.toLocaleDateString();
      }
      case "month": {
        return view.toLocaleDateString("default", {
          month: "long",
          year: "numeric",
        });
      }
      case "week": {
        return `CW: ${getWeek(view) % 52}`;
      }
      // No default
    }
    return "";
  };

  const [shownCalendars, setShownCalendars] = useState<
    (typeof calendarModel.$inferSelect)[]
  >([]);

  const toggleCalendar = (id: string) => {
    setShownCalendars((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return [...prev, calendars.find((c) => c.id === id)!];
      const newCalendars = [...prev];
      newCalendars.splice(index, 1);
      return newCalendars;
    });
  };

  const [selectedCalendar, setSelectedCalendar] = useState<
    null | typeof calendarModel.$inferSelect
  >(null);

  useEffect(() => {
    if (!showCalendar) {
      setSelectedCalendar(null);
      setTimeout(() => {
        fetch("/api/calendars")
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            setCalendars(data);
            setShownCalendars(data);
          });
      }, 1000);
    }
  }, [showCalendar]);

  const openCalendarModal = (
    calendar: null | typeof calendarModel.$inferSelect,
  ) => {
    setShowCalendar(true);
    setSelectedCalendar(calendar);
  };

  return (
    <div className="border-ctp-overlay2 flex h-full min-w-full flex-col items-center rounded border-2">
      <div className="m-1 grid h-fit w-full grid-cols-3 items-center">
        <div className="flex h-12 w-full items-center gap-2 pl-4">
          <Button onClick={() => setSettingsOpen(true)}>&equiv;</Button>
          <Button onClick={() => prev(setView, selectedView)}>&lt;</Button>
          <Button onClick={() => today(setView)}>&#128197;</Button>
          <Button onClick={() => next(setView, selectedView)}>&gt;</Button>
        </div>

        <div className="text-ctp-text w-full text-center">
          {mounted ? getViewDisplayText() : <DateSkeleton />}
        </div>
        <div className="border-ctp-surface1 bg-ctp-surface0 text-ctp-text mr-4 flex h-8 w-50 items-center justify-between justify-self-end rounded-full border">
          <button
            className={
              "h-7 cursor-pointer rounded-full px-2 text-center" +
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
              "h-7 cursor-pointer rounded-full px-2 text-center" +
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
              "h-7 cursor-pointer rounded-full px-2 text-center" +
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

      <div className="border-t-ctp-overlay2 h-0 w-9/10 border-t bg-none"></div>

      <div className="flex h-full w-full overflow-hidden">
        {pickView(
          selectedView,
          view,
          localEvents.filter((event) =>
            shownCalendars
              .map((calendar) => calendar.id)
              .includes(event.calendarId),
          ),
          openModal,
          settings,
          setView,
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen ? (
        <EventModal
          calendars={calendars}
          initialEvent={eventData ?? undefined}
          setEditorOpen={setEditorOpen}
          setLocalEvents={setLocalEvents}
          setUpdate={setUpdate}
          view={view}
        />
      ) : null}

      {showCalendar ? (
        <CalendarModal
          calendar={selectedCalendar}
          setModalOpen={setShowCalendar}
          setUpdate={setUpdate}
        />
      ) : null}
      {settingsOpen ? (
        <CalendarSettings
          calendars={calendars}
          openCalendarModal={openCalendarModal}
          setModalOpen={setSettingsOpen}
          setSettings={setSettings}
          settings={settings}
          shownCalendars={shownCalendars}
          toggleCalendar={toggleCalendar}
        />
      ) : null}
    </div>
  );
}

export function fromLocalDateTimeValue(v: string): Date {
  // v like "2026-02-02T09:30"
  return new Date(v);
}

export function toLocalDateTimeValue(d: Date) {
  // yyyy-MM-ddTHH:mm (local)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DateSkeleton() {
  return <div className="bg-ctp-surface1 h-6 w-32 animate-pulse rounded"></div>;
}

function next(setView: Dispatch<SetStateAction<Date>>, selectedView: string) {
  switch (selectedView) {
    case "day":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
      break;
    case "month":
      setView((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      break;
    case "week":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
      break;
  }
}

function prev(setView: Dispatch<SetStateAction<Date>>, selectedView: string) {
  switch (selectedView) {
    case "day":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
      break;
    case "month":
      setView((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      break;
    case "week":
      setView((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
      break;
  }
}

function today(setView: Dispatch<SetStateAction<Date>>) {
  setView(new Date());
}
