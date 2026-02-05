"use client";
// Needed for rendering DateTime in the correct TZ

import { Dispatch, SetStateAction, useMemo } from "react";

import { calendarEvents, settings as settingsModel } from "@/lib/db";

import { CalendarEvent } from "../lib/CalendarEvent";
import { dateString, getEventsByDay } from "../lib/time";
import { DaySummary } from "./DaySummary";

type DayCell = {
  date: Date;
  inMonth: boolean;
  key: string; //YYYY-MM-DD
};

type Props = {
  events: (CalendarEvent & { color: string })[];
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
  settings: typeof settingsModel.$inferSelect;
  setView: Dispatch<SetStateAction<Date>>;
  view: Date;
};

export default function MonthView({
  events,
  openModal,
  settings,
  setView,
  view,
}: Props) {
  const grid = useMemo(
    () => buildMonthGrid(view, settings.weekStart),
    [view, settings.weekStart],
  );

  const eventsByDay = useMemo(() => {
    return getEventsByDay(events);
  }, [events]);

  const rotateWeekdays = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < settings.weekStart; i++) {
      weekdays.push(weekdays.shift()!);
    }
    return weekdays;
  };

  const selectedEvents = useMemo(() => {
    return eventsByDay.get(dateString(view)) ?? [];
  }, [view, eventsByDay]);

  return (
    <div className="flex h-full w-full">
      {/* Left: Month grid */}
      <div className="w-7/10 flex-1 p-4">
        {/* Weekday row */}
        <div className="text-ctp-subtext0 grid grid-cols-7 gap-2 pb-2 text-xs font-medium">
          {rotateWeekdays().map((wd) => (
            <div key={wd}>{wd}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid h-full grid-cols-7 grid-rows-5 gap-2 pb-6">
          {grid.map((cell) => {
            const dayEvents = eventsByDay.get(dateString(cell.date)) ?? [];
            const isSelected = dateString(cell.date) === dateString(view);

            return (
              <button
                className={[
                  "flex flex-col rounded border px-2 pt-1 text-left transition",
                  cell.inMonth
                    ? "bg-ctp-surface1"
                    : "bg-ctp-surface0 text-ctp-text",
                  isSelected
                    ? "border-ctp-overlay2 ring-ctp-base/10 ring-2"
                    : "border-ctp-base hover:bg-ctp-surface2",
                ].join(" ")}
                key={cell.key}
                onClick={() => setView(cell.date)}
              >
                <div className="flex items-start justify-between">
                  <div className="text-ctp-text text-sm font-semibold">
                    {cell.date.getDate()}
                  </div>
                  {dayEvents.length > 0 ? (
                    <div className="bg-ctp-crust text-ctp-text flex aspect-square items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      {dayEvents.length}
                    </div>
                  ) : null}
                </div>

                <div className="mt-1 space-y-1">
                  {dayEvents.length > 2 ? (
                    <>
                      {dayEvents.slice(0, 1).map((e, idx) => (
                        <div
                          className={`text-ctp-base truncate rounded px-1.5 py-1 text-xs bg-ctp-${e.color}`}
                          key={`${cell.key}-${idx}-${e.title}`}
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      <div className="text-ctp-subtext0 bg-ctp-${e.color} text-[11px]">
                        +{dayEvents.length - 1} more
                      </div>
                    </>
                  ) : (
                    dayEvents.map((e, idx) => (
                      <div
                        className={`text-ctp-base truncate rounded px-1.5 py-1 text-xs bg-ctp-${e.color}`}
                        key={`${cell.key}-${idx}-${e.title}`}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Day detail */}
      <div className="border-ctp-overlay2 w-3/10 border-l p-4">
        <DaySummary
          openModal={openModal}
          selectedEvents={selectedEvents}
          settings={settings}
          view={view}
        />
      </div>
    </div>
  );
}

function buildMonthGrid(view: Date, weekStart: number = 0): DayCell[] {
  const start = startOfMonth(view);
  const end = endOfMonth(view);

  const startDow = start.getDay();
  const offset = (startDow - weekStart + 7) % 7;

  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - offset);

  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - end.getDay())); //forward to Saturday

  const days: DayCell[] = [];
  const cur = new Date(gridStart);

  for (let i = 0; i < 35; i++) {
    const inMonth = cur.getMonth() === view.getMonth();
    days.push({ date: new Date(cur), inMonth, key: cur.toISOString() });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
