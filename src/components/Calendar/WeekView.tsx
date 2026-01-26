import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { CalendarEvent } from "../lib/CalendarEvent";
import { dateString, formatTimeLocal, getEventsByDay } from "../lib/time";
import { DaySummary } from "./DaySummary";
import { calendarEvents, settings as settingsModel } from "@db";

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
  inMonth: boolean;
  events?: (CalendarEvent & { color: string })[];
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
      inMonth: date.getMonth() === startDate.getMonth(),
      events: events.get(dateString(date)),
    });
  }
  return cells;
};

export default function WeekView({
  events,
  settings,
  view,
  setView,
  openModal,
  setDisplayedDateRange,
  dateRange,
}: {
  events: (CalendarEvent & { color: string })[];
  settings: typeof settingsModel.$inferSelect;
  view: Date;
  setView: Dispatch<SetStateAction<Date>>;
  openModal: (event?: typeof calendarEvents.$inferInsert) => void;
  setDisplayedDateRange: Dispatch<SetStateAction<[Date, Date]>>;
  dateRange: [Date, Date];
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

  useEffect(() => {
    const start = getWeekStartDate(
      view.getFullYear(),
      getWeek(view, settings.weekStart),
      settings.weekStart,
    );
    const week = buildWeek(start, new Map());
    const startDate = week[0].date;
    const endDate = week[week.length - 1].date;
    if (
      dateRange[0].getTime() !== startDate.getTime() ||
      dateRange[1].getTime() !== endDate.getTime()
    ) {
      setDisplayedDateRange([startDate, endDate]);
    }
  }, [view, dateRange, setDisplayedDateRange, settings]);

  const selectedEvents = useMemo(() => {
    return eventsByDay.get(dateString(view)) ?? [];
  }, [view, eventsByDay]);

  return (
    <div className="w-full h-full flex">
      <div className="grid grid-cols-7 overflow-scroll overscroll-none no-scrollbar w-7/10 divide-ctp-surface2 divide-x">
        {week.map((day, index) => {
          return (
            <div
              key={index}
              className={`min-h-full h-fit flex flex-col text-ctp-text items-center ${view.getDay() === day.date.getDay() ? "bg-ctp-surface0" : ""}`}
              onClick={() => setView(day.date)}
            >
              <div className="sticky top-0 bg-ctp-surface2 w-full text-center flex flex-col">
                <p>
                  {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p>
                  {day.date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-center w-full px-1 pt-1 gap-1">
                {day.events?.map((event, index) => (
                  <div
                    key={index}
                    className={`bg-ctp-overlay2 p-1 rounded-md w-full text-xs text-ctp-base outline-2 outline-ctp-${event.color}`}
                  >
                    {event.allDay
                      ? "All Day"
                      : `${
                          dateString(day.date) == dateString(event.start)
                            ? formatTimeLocal(event.start)
                            : "..."
                        }–${
                          dateString(day.date) == dateString(event.end)
                            ? formatTimeLocal(event.end)
                            : "..."
                        }`}
                    <br />
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
