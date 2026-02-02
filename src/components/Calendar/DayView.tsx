"use client";
import { settings as settingsModel } from "@db";
// Needed for rendering DateTime in the correct TZ
//
import { createRef, ReactNode, Ref, useEffect, useMemo } from "react";

import { calendarEvents } from "@/lib/db";

import { CalendarEvent } from "../lib/CalendarEvent";
import { checkOverlap } from "../lib/time";
import {
  addDates,
  day,
  formatTime,
  formatTimeLocal,
  hour,
  truncDate,
} from "../lib/time";

export default function DayView({
  events,
  openModal,
  settings,
  view,
}: {
  events: Array<CalendarEvent & { color: string }>;
  openModal: (
    initialEvent?: Partial<typeof calendarEvents.$inferInsert>,
  ) => void;
  settings: typeof settingsModel.$inferSelect;
  view: Date;
}) {
  /* get visible timespan from selected date */
  const timespan: [Date, Date] = useMemo(() => {
    const ts = [addDates(truncDate(view), new Date(0))];
    ts.push(addDates(ts[0], day));
    return ts as [Date, Date];
  }, [view]);

  interface RelativeEvent {
    column: number;
    end: number;
    end_slot: number;
    event: CalendarEvent & { color: string };
    start: number;
    start_slot: number;
  }
  /* filter out events that are not visible, and convert times to be relative *
   * to the visible timespan                                                  */
  const filtered_events: Array<RelativeEvent> = events
    .filter((event) => checkOverlap(timespan, [event.start, event.end]))
    .map((event) => {
      const relEvent: RelativeEvent = {
        column: 0,
        end: fMapPerc(
          Number(event.end),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        end_slot: 0,
        event,
        start: fMapPerc(
          Number(event.start),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        start_slot: 0,
      };
      return relEvent;
    });
  /* sort by start times then end times */
  filtered_events.sort((a: RelativeEvent, b: RelativeEvent) => {
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
  const active_events: Array<null | RelativeEvent> = [];
  let i: number = 1;
  for (const time of time_splits) {
    /* remove all of the ending events */
    const end_events: Array<RelativeEvent> = filtered_events.filter(
      (event) => event.end == time,
    );
    for (const event of end_events) {
      event.end_slot = i;
      if (active_events.includes(event))
        active_events[active_events.indexOf(event)] = null;
    }

    /* push all of the starting events */
    const start_events: Array<RelativeEvent> = filtered_events.filter(
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
    if (Number.isInteger(time * lines_per_day)) line_markers.push(i);

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

  const refs = timestamps.map(() => createRef<HTMLDivElement>());

  const time_marks: Array<ReactNode> = timestamps.map((time, i) =>
    TimeMarker(
      `marker-${i}`,
      refs[i],
      formatTimeLocal(time, settings.timeFormat),
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
      className="z-1 grid min-h-max w-full items-stretch p-1"
      style={Object.assign(
        {
          gridAutoColumns: "max-content " + "1fr ".repeat(grid_cols),
          gridTemplateRows: grid_row_str,
        },
        !filtered_events.length ? { height: "100%" } : {},
      )}
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
          settings.timeFormat,
        );
      })}
    </div>
  );

  useEffect(() => {
    const ref = refs[settings.dayStartHour];
    console.log(ref);
    ref.current?.scrollIntoView({
      behavior: "instant",
    });
  }, [view, refs, settings.dayStartHour]);

  return (
    <div className="h-full w-full grow overflow-y-scroll overscroll-none">
      {event_grid}
    </div>
  );
}

function DayEvent(
  event: CalendarEvent & { color: string },
  top: number,
  left: number,
  bottom: number,
  key: number,
  view: Date,
  openModal: (event: typeof calendarEvents.$inferSelect) => void,
  timeFormat: string,
): ReactNode {
  return (
    <button
      className={`text-ctp-base rounded hover:bg-ctp-${event.color}-200 m-2 cursor-pointer px-2 text-left align-text-top bg-ctp-${event.color}`}
      key={key}
      onClick={() => openModal(event)}
      style={{
        gridColumnEnd: "span 1",
        gridColumnStart: left,
        gridRowEnd: bottom,
        gridRowStart: top,
        minHeight: "min-content",
      }}
    >
      <b>{event.title}</b>
      <br></br>
      {formatTime(event, view, timeFormat)}
    </button>
  );
}

function fMapPerc(val: number, min: number, max: number): number {
  return Math.max(0.0, Math.min(1.0, (val - min) / (max - min)));
}

function TimeMarker(
  key: string,
  ref: Ref<HTMLDivElement>,
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
      className="text-right"
      key={key}
      ref={ref}
      style={{
        gridColumn: 1,
        gridRowEnd: end,
        gridRowStart: start,
        zIndex: 1,
      }}
    >
      {text}
    </div>,
    /* lines */
    <div
      className="border-t-ctp-surface1 hover:bg-ctp-surface1 min-h-12 border-t-2"
      key={`${key}-line`}
      onClick={() => {
        openModal({ end: time_end, start: time_start });
      }}
      style={{
        gridColumnEnd: columns + 2,
        gridColumnStart: 1,
        gridRowEnd: end,
        gridRowStart: start,
        width: "100%",
      }}
    ></div>,
  ];
}
