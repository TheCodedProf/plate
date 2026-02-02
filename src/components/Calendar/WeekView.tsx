"use client";
// Needed for rendering DateTime in the correct TZ

import { calendarEvents, settings as settingsModel } from "@db";
import { Dispatch, SetStateAction, useMemo } from "react";

import { CalendarEvent } from "../lib/CalendarEvent";
import { dateString, formatTimeLocal, getEventsByDay } from "../lib/time";
import { DaySummary } from "./DaySummary";

export const getWeek = (date: Date, weekStart = 0): number => {
  const d = new Date(date);
  const day = (d.getDay() - weekStart + 7) % 7;
  const nearestWeekStart = new Date(d);
  nearestWeekStart.setDate(d.getDate() - day);

  const jan1 = new Date(d.getFullYear(), 0, 1);
  const jan1Day = (jan1.getDay() - weekStart + 7) % 7;
  const firstWeekStart = new Date(jan1);
  firstWeekStart.setDate(jan1.getDate() - jan1Day);

  return (
    1 +
    Math.round(
      (nearestWeekStart.getTime() - firstWeekStart.getTime()) / 604800000,
    )
  );
};

export const getWeekStartDate = (
  year: number,
  week: number,
  weekStart = 0,
): Date => {
  const jan1 = new Date(year, 0, 1);
  const jan1Day = (jan1.getDay() - weekStart + 7) % 7;
  const firstWeekStart = new Date(jan1);
  firstWeekStart.setDate(jan1.getDate() - jan1Day);
  return new Date(
    firstWeekStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000,
  );
};

interface DayCell {
  date: Date;
  events?: (CalendarEvent & { color: string })[];
  inMonth: boolean;
}

const buildWeek = (
  startDate: Date,
  events: Map<string, (CalendarEvent & { color: string })[]>,
): DayCell[] => {
  const cells: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    cells.push({
      date,
      events: events.get(dateString(date)),
      inMonth: date.getMonth() === startDate.getMonth(),
    });
  }
  return cells;
};

export default function WeekView({
  events,
  openModal,
  settings,
  setView,
  view,
}: {
  events: (CalendarEvent & { color: string })[];
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
  settings: typeof settingsModel.$inferSelect;
  setView: Dispatch<SetStateAction<Date>>;
  view: Date;
}) {
  const eventsByDay = useMemo(() => {
    return getEventsByDay(events);
  }, [events]);

  const week = useMemo(() => {
    const startDate = getWeekStartDate(
      view.getFullYear(),
      getWeek(view, settings.weekStart),
      settings.weekStart,
    );
    return buildWeek(startDate, eventsByDay);
  }, [eventsByDay, view, settings]);

  const selectedEvents = useMemo(() => {
    return eventsByDay.get(dateString(view)) ?? [];
  }, [view, eventsByDay]);

  return (
    <div className="flex min-h-full w-full grow">
      <div className="no-scrollbar divide-ctp-surface2 grid min-h-max w-7/10 grid-cols-7 divide-x overflow-scroll overscroll-none">
        {week.map((day, index) => {
          return (
            <div
              className={`text-ctp-text flex h-full min-h-max flex-col items-center ${view.getDay() === day.date.getDay() ? "bg-ctp-surface0" : ""}`}
              key={index}
              onClick={() => setView(day.date)}
            >
              <div className="bg-ctp-surface2 sticky top-0 flex w-full flex-col text-center">
                <p>
                  {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p>
                  {day.date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <div className="flex max-h-full w-full flex-col items-center gap-1 px-1 pt-1 text-ellipsis whitespace-nowrap">
                {day.events
                  ?.map((event) => {
                    const newEvent: typeof event & {
                      endTime?: string;
                      startTime?: string;
                    } = { ...event };
                    newEvent.startTime =
                      dateString(day.date) == dateString(event.start)
                        ? formatTimeLocal(event.start, settings.timeFormat)
                        : "...";
                    newEvent.endTime =
                      dateString(day.date) == dateString(event.end)
                        ? formatTimeLocal(event.end, settings.timeFormat)
                        : "...";
                    return newEvent;
                  })
                  .map((event, index) => (
                    <div
                      className={`text-ctp-base w-full rounded-md p-1 text-xs bg-ctp-${event.color} truncate`}
                      key={index}
                    >
                      {event.allDay
                        ? "All Day"
                        : `${event.startTime ?? ""}–${event.endTime ?? ""}`}
                      <br />
                      {event.title}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
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
