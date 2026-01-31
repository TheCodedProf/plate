import { CalendarEvent } from "./CalendarEvent";

export const day: Date = new Date("1970-01-01T23:59:59.999+00:00");
export const hour: Date = new Date("1970-01-01T01:00:00.000+00:00");
export const minute: Date = new Date("1970-01-01T00:01:00.000+00:00");
export const second: Date = new Date("1970-01-01T00:00:01.000+00:00");

export function addDates(a: Date, b: Date): Date {
  return new Date(Number(a) + Number(b));
}

export function scaleDate(date: Date, scalar: number): Date {
  return new Date(Number(date) * scalar);
}

export function truncDate(date: Date): Date {
  const s: number = Number(second) * date.getSeconds();
  const m: number = Number(minute) * date.getMinutes();
  const h: number = Number(hour) * date.getHours();
  return new Date(Number(date) - (h + m + s));
}

export const formatTimeLocal = (d: Date) => {
  return new Date(d).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatTime = (event: CalendarEvent, view: Date) => {
  view = new Date(view);
  event.start = new Date(event.start);
  event.end = new Date(event.end);
  return event.allDay
    ? "All day"
    : `${dateString(view) == dateString(event.start) ? formatTimeLocal(event.start) : ""}–${dateString(view) == dateString(event.end) ? formatTimeLocal(event.end) : ""}`;
};

export function checkOverlap(
  timespan_a: [Date, Date],
  timespan_b: [Date, Date],
): boolean {
  if (timespan_a[1] < timespan_b[0] || timespan_b[1] < timespan_a[0])
    return false;
  return true;
}

export const dateString = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US").slice(0, 10);
};

export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export const getEventsByDay = (
  events: (CalendarEvent & { color: string })[],
) => {
  const m = new Map<string, (CalendarEvent & { color: string })[]>();

  for (const event of events) {
    const dates = getDatesBetween(new Date(event.start), new Date(event.end));
    for (const date of dates) {
      const list = m.get(dateString(date)) ?? [];
      list.push(event);
      m.set(dateString(date), list);
    }
  }

  for (const [k, list] of m.entries()) {
    list.sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    m.set(k, list);
  }

  return m;
};
