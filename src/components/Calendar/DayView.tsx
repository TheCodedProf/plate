"use client";
// Needed for rendering DateTime in the correct TZ

import { calendarEvents, settings as settingsModel } from "@db";
import { createRef, ReactNode, Ref, useEffect, useMemo } from "react";

import { CalendarEvent } from "../lib/CalendarEvent";
import { checkOverlap } from "../lib/time";
import {
  addDates,
  almost_day,
  day,
  formatTime,
  formatTimeLocal,
  hour,
  truncDate,
} from "../lib/time";

interface RelativeEvent {
  event: CalendarEvent & { color: string };
  start: number;
  // eslint-disable-next-line perfectionist/sort-interfaces
  end: number;

  /* computed later  */
  start_slot: number;
  // eslint-disable-next-line perfectionist/sort-interfaces
  end_slot: number;
  // eslint-disable-next-line perfectionist/sort-interfaces
  column: number;
}

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

  /* required to avoid displaying events that start at midnight */
  const timespan_filter: [Date, Date] = [
    timespan[0],
    addDates(timespan[0], almost_day),
  ];

  /* filter out events that are not visible, and convert times to be relative *
   * to the visible timespan                                                  */
  const filtered_events: Array<RelativeEvent> = events
    .filter((event) => checkOverlap(timespan_filter, [event.start, event.end]))
    .map((event) => {
      const relEvent: RelativeEvent = {
        event,
        // eslint-disable-next-line perfectionist/sort-objects
        end: fMapPerc(
          Number(event.end),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        start: fMapPerc(
          Number(event.start),
          Number(timespan[0]),
          Number(timespan[1]),
        ),
        start_slot: 0,
        // eslint-disable-next-line perfectionist/sort-objects
        end_slot: 0,
        // eslint-disable-next-line perfectionist/sort-objects
        column: 0,
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
  const time_splits: Array<number> = getTimeSplits(
    filtered_events,
    lines_per_day,
  );

  const line_markers: Array<number> = []; // the indexes of the time splits that should have markers
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
  const grid_row_str: string = createRowString(time_splits);

  /* the timestamps on the side of the timeline */
  const timestamps: Array<Date> = createTimeStamps(lines_per_day, timespan);

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
      style={{
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

/* * * * * * * * * * *
 * Utility Functions *
 * * * * * * * * * * */

function createRowString(time_splits: Array<number>): string {
  let row_str: string = "";
  let prev_row: number = time_splits[0];
  for (const row of time_splits.slice(1)) {
    const row_size: number = row - prev_row;
    prev_row = row;
    row_str += ` ${Math.round(row_size * 100)}fr`;
  }
  return row_str;
}

function createTimeStamps(count: number, timespan: [Date, Date]): Array<Date> {
  const span: [number, number] = [Number(timespan[0]), Number(timespan[1])];
  const diff: number = span[1] - span[0];

  const timestamps: Array<Date> = [];
  let latest_timestamp: number = span[0];
  while (latest_timestamp < span[1]) {
    timestamps.push(new Date(latest_timestamp));
    latest_timestamp += diff / count;
  }
  return timestamps;
}

function fMapPerc(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function getTimeSplits(
  events: Array<RelativeEvent>,
  fixed_splits: number,
): Array<number> {
  // eslint-disable-next-line unicorn/no-zero-fractions
  const time_splits: Array<number> = [0.0, 1.0];
  for (let i: number = 1; i < fixed_splits; i++)
    time_splits.push(i / fixed_splits);
  for (const event of events) {
    if (!time_splits.includes(event.start)) time_splits.push(event.start);
    if (!time_splits.includes(event.end)) time_splits.push(event.end);
  }
  return time_splits.toSorted();
}

/* * * * * * * *
 * ReactNodes  *
 * * * * * * * */

// eslint-disable-next-line perfectionist/sort-modules
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
      ref={ref}
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
