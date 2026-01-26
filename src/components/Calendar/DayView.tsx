import { ReactNode, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { CalendarEvent } from "../lib/CalendarEvent";
import { checkOverlap } from "../lib/time";
import {
  day,
  hour,
  truncDate,
  addDates,
  scaleDate,
  formatTime,
  formatTimeLocal,
} from "../lib/time";
import { settings as settingsModel } from "@db";
import { calendarEvents } from "@/lib/db";

function fMapPerc(val: number, min: number, max: number): number {
  return Math.max(0.0, Math.min(1.0, (val - min) / (max - min)));
}

function DayEvent(
  event: CalendarEvent & { color: string },
  top: number,
  left: number,
  bottom: number,
  key: number,
  view: Date,
  openModal: (event: typeof calendarEvents.$inferSelect) => void,
): ReactNode {
  return (
    <button
      onClick={() => openModal(event)}
      className={`rounded text-ctp-text bg-ctp-surface1 hover:bg-ctp-surface2 px-2 cursor-pointer text-left align-text-top m-2 outline-2 outline-ctp-${event.color}`}
      key={key}
      style={{
        gridColumnStart: left,
        gridColumnEnd: "span 1",
        gridRowStart: top,
        gridRowEnd: bottom,
        minHeight: "min-content",
      }}
    >
      <b>{event.title}</b>
      <br></br>
      {formatTime(event, view)}
    </button>
  );
}

function TimeMarker(
  key: string,
  text: string,
  start: number,
  end: number,
  columns: number,
  time_start: Date,
  time_end: Date,
  openModal: (
    initialEvent?: Partial<typeof calendarEvents.$inferInsert>,
  ) => void,
): [ReactNode, ReactNode] {
  return [
    /* time text */
    <div
      key={key}
      style={{
        gridRowStart: start,
        gridRowEnd: end,
        gridColumn: 1,
        zIndex: 1,
      }}
    >
      {text}
    </div>,
    /* lines */
    <div
      key={`${key}-line`}
      className="border-t-2 border-t-ctp-surface1 hover:bg-ctp-surface1"
      style={{
        gridRowStart: start,
        gridRowEnd: end,
        gridColumnStart: 1,
        gridColumnEnd: columns + 2,
        width: "100%",
      }}
      onClick={() => {
        openModal({ start: time_start, end: time_end });
      }}
    ></div>,
  ];
}

export default function DayView({
  events,
  view,
  settings,
  openModal,
  setDisplayedDateRange,
  dateRange,
}: {
  events: Array<CalendarEvent & { color: string }>;
  view: Date;
  settings: typeof settingsModel.$inferSelect;
  openModal: (
    initialEvent?: Partial<typeof calendarEvents.$inferInsert>,
  ) => void;
  setDisplayedDateRange: Dispatch<SetStateAction<[Date, Date]>>;
  dateRange: [Date, Date];
}) {
  /* get visible timespan from selected date */
  const timespan: [Date, Date] = useMemo(() => {
    const ts = [
      addDates(truncDate(view), scaleDate(hour, settings.dayStartHour)),
    ];
    ts.push(addDates(ts[0], day));
    return ts as [Date, Date];
  }, [view, settings.dayStartHour]);

  useEffect(() => {
    if (dateRange[0] !== timespan[0] || dateRange[1] !== timespan[1]) {
      setDisplayedDateRange(timespan);
    }
  }, [timespan, setDisplayedDateRange, dateRange]);

  interface relativeEvent {
    event: CalendarEvent & { color: string };
    start: number;
    end: number;
    start_slot: number;
    end_slot: number;
    column: number;
  }
  /* filter out events that are not visible, and convert times to be relative *
   * to the visible timespan                                                  */
  const filtered_events: Array<relativeEvent> = events
    .filter((event) => checkOverlap(timespan, [event.start, event.end]))
    .map((event) => {
      const relEvent: relativeEvent = {
        event,
        start: fMapPerc(
          Number(event.start),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        end: fMapPerc(
          Number(event.end),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        start_slot: 0,
        end_slot: 0,
        column: 0,
      };
      return relEvent;
    });
  /* sort by start times then end times */
  filtered_events.sort((a: relativeEvent, b: relativeEvent) => {
    if (a.start == b.start) return a.end - b.end;
    return a.start - b.start;
  });

  const lines_per_day: number = 24;

  /* compile a list of all event times */
  const time_splits: Array<number> = [0.0, 1.0];
  for (let i: number = 1; i < lines_per_day; i++)
    time_splits.push(i / lines_per_day);
  filtered_events.forEach((event) => {
    if (!time_splits.includes(event.start)) time_splits.push(event.start);
    if (!time_splits.includes(event.end)) time_splits.push(event.end);
  });
  time_splits.sort();

  const line_markers: Array<number> = [];
  /* arrange the events on the grid */
  const active_events: Array<relativeEvent | null> = [];
  let i: number = 1;
  for (const time of time_splits) {
    /* remove all of the ending events */
    const end_events: Array<relativeEvent> = filtered_events.filter(
      (event) => event.end == time,
    );
    for (const event of end_events) {
      event.end_slot = i;
      if (active_events.includes(event))
        active_events[active_events.indexOf(event)] = null;
    }

    /* push all of the starting events */
    const start_events: Array<relativeEvent> = filtered_events.filter(
      (event) => event.start == time,
    );
    for (const event of start_events) {
      event.start_slot = i;
      if (active_events.includes(null)) {
        active_events[active_events.indexOf(null)] = event;
      } else {
        active_events.push(event);
      }
      event.column = active_events.indexOf(event) + 1;
    }

    /* add time interval marker */
    if ((time * lines_per_day) % 1.0 == 0.0) line_markers.push(i);

    i++;
  }
  const grid_cols: number = Math.max(active_events.length, 1);

  /* convert from positions to sizes */
  let grid_row_str: string = "";
  let prev_grid_row: number = 0;
  for (const row of time_splits.slice(1)) {
    const row_size: number = row - prev_grid_row;
    prev_grid_row = row;
    grid_row_str += ` ${Math.round(row_size * 100)}fr`;
  }

  /* the timestamps on the side of the timeline */
  const timestamps: Array<Date> = [];
  let latest_timestamp: number = Number(timespan[0]);
  while (latest_timestamp < Number(timespan[1])) {
    timestamps.push(new Date(latest_timestamp));
    latest_timestamp += Number(hour);
  }

  const time_marks: Array<ReactNode> = timestamps.map((time, i) =>
    TimeMarker(
      `marker-${i}`,
      formatTimeLocal(time),
      line_markers[i],
      line_markers[i + 1],
      grid_cols,
      time,
      addDates(time, hour),
      openModal,
    ),
  );

  /* the grid that displays all the events on the timeline */
  const event_grid: ReactNode = (
    <div
      //onLoad={() => scrollTo({ top: 100, behavior: "instant" })}
      className="w-full z-1 grid items-start p-1"
      style={{
        minHeight: "max-content",
        alignItems: "stretch",
        //justifyItems: "start",
        gridAutoColumns: "max-content " + "1fr ".repeat(grid_cols),
        gridTemplateRows: grid_row_str,
      }}
    >
      {time_marks}
      {filtered_events.map((event, i) => {
        return DayEvent(
          event.event,
          event.start_slot,
          event.column + 1,
          event.end_slot,
          i,
          view,
          openModal,
        );
      })}
    </div>
  );
  return (
    <div className="overscroll-none h-full w-full overflow-y-scroll">
      {event_grid}
    </div>
  );
}
