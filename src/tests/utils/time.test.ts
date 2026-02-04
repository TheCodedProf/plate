import { describe, expect, it } from "bun:test";

import * as TIME from "@/components/lib/time";

import eventSampleData from "./sampleData.json";

describe("time.ts", () => {
  it("should add the two dates as numbers", () => {
    const start: Date = new Date("1970-01-01T05:23:19.000+00:00");

    const next_day: Date = TIME.addDates(start, TIME.day);
    expect(next_day).toEqual(new Date("1970-01-02T05:23:19.000+00:00"));
    const day_after: Date = TIME.addDates(next_day, TIME.day);
    expect(day_after).toEqual(new Date("1970-01-03T05:23:19.000+00:00"));

    const next_hour: Date = TIME.addDates(start, TIME.hour);
    expect(next_hour).toEqual(new Date("1970-01-01T06:23:19.000+00:00"));
    const hour_after: Date = TIME.addDates(next_hour, TIME.hour);
    expect(hour_after).toEqual(new Date("1970-01-01T07:23:19.000+00:00"));

    const next_minute: Date = TIME.addDates(start, TIME.minute);
    expect(next_minute).toEqual(new Date("1970-01-01T05:24:19.000+00:00"));
    const minute_after: Date = TIME.addDates(next_minute, TIME.minute);
    expect(minute_after).toEqual(new Date("1970-01-01T05:25:19.000+00:00"));

    const next_second: Date = TIME.addDates(start, TIME.second);
    expect(next_second).toEqual(new Date("1970-01-01T05:23:20.000+00:00"));
    const second_after: Date = TIME.addDates(next_second, TIME.second);
    expect(second_after).toEqual(new Date("1970-01-01T05:23:21.000+00:00"));
  });

  it("should return true if the dates overlap (inclusively)", () => {
    const A: Date = new Date("2025-11-01T00:00:00.000+00:00");
    const B: Date = new Date("2025-11-01T23:59:59.999+00:00");
    const C: Date = new Date("2025-11-02T00:00:00.000+00:00");
    const D: Date = new Date("2026-01-01T00:00:00.000+00:00");
    const E: Date = new Date("2026-05-05T00:00:00.000+00:00");

    expect(TIME.checkOverlap([A, B], [A, B])).toBe(true); // a timespan should always overlap with itself
    expect(TIME.checkOverlap([A, B], [B, D])).toBe(true); // overlaps for one instant

    expect(TIME.checkOverlap([A, B], [C, D])).toBe(false);
    expect(TIME.checkOverlap([C, D], [A, B])).toBe(false);

    expect(TIME.checkOverlap([A, D], [B, C])).toBe(true);
    expect(TIME.checkOverlap([A, D], [B, E])).toBe(true);
    expect(TIME.checkOverlap([D, E], [B, E])).toBe(true);
    expect(TIME.checkOverlap([C, D], [A, E])).toBe(true);
  });

  it("should return a date object for the input date at midnight", () => {
    const date: Date = new Date("2025-11-01T00:00:00.000+00:00");

    expect(TIME.truncDate(new Date("2025-11-01T03:25:19.000+00:00"))).toEqual(
      date,
    );
    expect(TIME.truncDate(new Date("2025-11-01T09:05:00.000+00:00"))).toEqual(
      date,
    );
    expect(TIME.truncDate(new Date("2025-11-01T12:00:00.000+00:00"))).toEqual(
      date,
    );
    expect(TIME.truncDate(new Date("2025-11-01T16:38:42.000+00:00"))).toEqual(
      date,
    );
    expect(TIME.truncDate(new Date("2025-11-01T23:59:59.000+00:00"))).toEqual(
      date,
    );
  });

  it("Should return a list of dates between 2 days", () => {
    const start: Date = new Date("2025-11-01T00:00:00.000+00:00");
    const end: Date = new Date("2025-11-04T00:00:00.000+00:00");

    const expectedDates: Date[] = [
      new Date("2025-11-01T00:00:00.000+00:00"),
      new Date("2025-11-02T00:00:00.000+00:00"),
      new Date("2025-11-03T00:00:00.000+00:00"),
      new Date("2025-11-04T00:00:00.000+00:00"),
    ];

    expect(TIME.getDatesBetween(start, end)).toEqual(expectedDates);
  });

  it("Should return a map of dates to events", () => {
    const events = eventSampleData.map((event) => ({
      ...event,
      color: "lavender",
      end: new Date(event.end),
      start: new Date(event.start),
    }));

    const ebd = TIME.getEventsByDay(events);
    expect(
      Array.from(
        ebd
          .keys()
          .filter((key) =>
            [
              "1/29/2026",
              "1/30/2026",
              "1/31/2026",
              "2/1/2026",
              "2/2/2026",
              "2/3/2026",
              "2/4/2026",
              "2/5/2026",
              "2/6/2026",
              "2/7/2026",
              "2/8/2026",
              "2/9/2026",
              "2/10/2026",
              "2/11/2026",
              "2/12/2026",
              "2/13/2026",
              "2/14/2026",
              "2/15/2026",
              "2/16/2026",
              "2/20/2026",
              "2/21/2026",
              "2/22/2026",
              "2/23/2026",
              "2/24/2026",
              "2/26/2026",
              "2/27/2026",
              "2/28/2026",
              "3/1/2026",
              "3/2/2026",
              "3/3/2026",
              "3/4/2026",
              "3/5/2026",
            ].includes(key),
          ),
      ).length,
    ).toBe(32);
  });
});
