"use client";
import { Dispatch, SetStateAction, useMemo } from "react";
import { CalendarEvent } from "../lib/CalendarEvent";
import { dateString, getEventsByDay } from "../lib/time";
import { DaySummary } from "./DaySummary";
import { settings as settingsModel, calendarEvents } from "@/lib/db";

type Props = {
  events: (CalendarEvent & { color: string })[];
  settings?: typeof settingsModel.$inferSelect;
  view: Date;
  setView: Dispatch<SetStateAction<Date>>;
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
};

type DayCell = {
  date: Date;
  inMonth: boolean;
  key: string; //YYYY-MM-DD
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
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

export default function MonthView({ events, view, setView, openModal }: Props) {
  const grid = useMemo(() => buildMonthGrid(view), [view]);

  const eventsByDay = useMemo(() => {
    return getEventsByDay(events);
  }, [events]);

  const selectedEvents = useMemo(() => {
    return eventsByDay.get(dateString(view)) ?? [];
  }, [view, eventsByDay]);

  return (
    <div className="flex w-full h-full">
      {/* Left: Month grid */}
      <div className="flex-1 p-4 w-7/10">
        {/* Weekday row */}
        <div className="grid grid-cols-7 gap-2 pb-2 text-xs text-ctp-subtext0 font-medium">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 grid-rows-5 gap-2 h-full pb-6">
          {grid.map((cell) => {
            const dayEvents = eventsByDay.get(dateString(cell.date)) ?? [];
            const isSelected = dateString(cell.date) === dateString(view);

            return (
              <button
                key={cell.key}
                onClick={() => setView(cell.date)}
                className={[
                  "rounded border px-2 pt-1 text-left transition flex flex-col",
                  cell.inMonth
                    ? "bg-ctp-surface1"
                    : "bg-ctp-surface0 text-ctp-text",
                  isSelected
                    ? "border-ctp-overlay2 ring-2 ring-ctp-base/10"
                    : "border-ctp-base hover:bg-ctp-surface2",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold text-ctp-text">
                    {cell.date.getDate()}
                  </div>
                  {dayEvents.length > 0 ? (
                    <div className="rounded-full bg-ctp-crust px-2 py-0.5 text-[10px] font-semibold text-ctp-text aspect-square justify-center items-center flex">
                      {dayEvents.length}
                    </div>
                  ) : null}
                </div>

                <div className="mt-1 space-y-1">
                  {dayEvents.length > 2 ? (
                    <>
                      {dayEvents.slice(0, 1).map((e, idx) => (
                        <div
                          key={`${cell.key}-${idx}-${e.title}`}
                          className="truncate rounded bg-ctp-overlay2 px-1.5 py-1 text-xs text-ctp-base"
                          title={e.title}
                        >
                          {e.title}
                        </div>
                      ))}
                      <div className="text-[11px] text-ctp-subtext0">
                        +{dayEvents.length - 1} more
                      </div>
                    </>
                  ) : (
                    dayEvents.map((e, idx) => (
                      <div
                        key={`${cell.key}-${idx}-${e.title}`}
                        className={`truncate rounded px-1.5 py-1 text-xs text-ctp-base bg-ctp-${e.color}`}
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
      <div className="w-3/10 border-l border-ctp-overlay2 p-4">
        <DaySummary
          selectedEvents={selectedEvents}
          view={view}
          openModal={openModal}
        />
      </div>
    </div>
  );
}
