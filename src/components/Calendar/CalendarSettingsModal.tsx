"use client";

import {
  calendarDisplayModes,
  calendars as calendarsDb,
  settings as settingsDb,
  timeFormats,
} from "@db";
import { Dispatch, SetStateAction } from "react";

import { updateSettings } from "@/lib/settingsDb";

import { Button } from "../lib/Button";

export function CalendarSettings({
  calendars,
  openCalendarModal,
  setModalOpen,
  setSettings,
  settings,
  shownCalendars,
  toggleCalendar,
}: {
  calendars: (typeof calendarsDb.$inferSelect)[];
  openCalendarModal: (calendar: null | typeof calendarsDb.$inferSelect) => void;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setSettings: Dispatch<SetStateAction<null | typeof settingsDb.$inferSelect>>;
  settings: typeof settingsDb.$inferSelect;
  shownCalendars: (typeof calendarsDb.$inferSelect)[];
  toggleCalendar: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={() => setModalOpen(false)}
      />

      <div className="bg-ctp-surface1 border-ctp-overlay2 z-70 w-[min(720px,92vw)] rounded border p-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-ctp-text text-lg font-bold">
              Calendar Settings
            </h2>
            <button
              className="text-ctp-text2 hover:text-ctp-text1 cursor-pointer"
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="bg-ctp-surface0 flex flex-col gap-1 rounded-lg p-2">
            <h2 className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Displayed Calendars
            </h2>
            {calendars
              .toSorted((a, b) => a.name.localeCompare(b.name))
              .toSorted((a, b) => Number(b.default) - Number(a.default))
              .map((c) => {
                return (
                  <div className="flex items-center gap-4 py-2" key={c.id}>
                    <input
                      checked={shownCalendars.some((cc) => cc.id === c.id)}
                      onChange={() => {
                        toggleCalendar(c.id);
                      }}
                      type="checkbox"
                    />
                    <label className={`text-ctp-${c.color}`}>{c.name}</label>
                    <Button
                      onClick={() => {
                        setModalOpen(false);
                        openCalendarModal(c);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                );
              })}
            <Button
              onClick={() => {
                setModalOpen(false);
                openCalendarModal(null);
              }}
            >
              New Calendar
            </Button>
          </div>
          <div className="bg-ctp-surface0 flex flex-col gap-1 rounded-lg p-2">
            <h2 className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Week Start
            </h2>
            <div className="flex justify-between">
              {[
                ["Monday", 1],
                ["Tuesday", 2],
                ["Wednesday", 3],
                ["Thursday", 4],
                ["Friday", 5],
                ["Saturday", 6],
                ["Sunday", 0],
              ].map(([day, index]) => (
                <button
                  className={
                    `outline-ctp-overlay2 rounded p-2 outline` +
                    (settings.weekStart === index
                      ? " bg-ctp-green text-ctp-base cursor-not-allowed"
                      : " bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2 cursor-pointer")
                  }
                  disabled={settings.weekStart === index}
                  key={day}
                  onClick={() => {
                    if (settings.weekStart !== index) {
                      const newSettings = updateSettings({
                        ...settings,
                        weekStart: Number(index),
                      });
                      Promise.resolve(newSettings).then((ns_res) => {
                        console.log("Settings updated");
                        setSettings(ns_res);
                      });
                    }
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-ctp-surface0 flex flex-col gap-1 rounded-lg p-2">
            <h2 className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Day Start
            </h2>
            <select
              className="outline-ctp-overlay2 bg-ctp-surface1 text-ctp-text rounded p-2 outline"
              onChange={(e) => {
                const newSettings = updateSettings({
                  ...settings,
                  dayStartHour: Number(e.target.value),
                });
                Promise.resolve(newSettings).then((ns_res) => {
                  console.log("Settings updated");
                  setSettings(ns_res);
                });
              }}
              value={settings.dayStartHour}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i}:00
                </option>
              ))}
            </select>
          </div>
          <div className="bg-ctp-surface0 flex flex-col gap-1 rounded-lg p-2">
            <h2 className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Time Display
            </h2>
            <select
              className="outline-ctp-overlay2 bg-ctp-surface1 text-ctp-text rounded p-2 outline"
              onChange={(e) => {
                const newSettings = updateSettings({
                  ...settings,
                  timeFormat: e.target
                    .value as (typeof timeFormats.enumValues)[number],
                });
                Promise.resolve(newSettings).then((ns_res) => {
                  console.log("Settings updated");
                  setSettings(ns_res);
                });
              }}
              value={settings.timeFormat}
            >
              {["12", "24"].map((format) => (
                <option key={format} value={format}>
                  {format} Hour
                </option>
              ))}
            </select>
          </div>
          <div className="bg-ctp-surface0 flex flex-col gap-1 rounded-lg p-2">
            <h2 className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Default Calendar View
            </h2>
            <select
              className="outline-ctp-overlay2 bg-ctp-surface1 text-ctp-text rounded p-2 outline"
              onChange={(e) => {
                const newSettings = updateSettings({
                  ...settings,
                  defaultCalendarDisplay: e.target
                    .value as (typeof calendarDisplayModes.enumValues)[number],
                });
                Promise.resolve(newSettings).then((ns_res) => {
                  console.log("Settings updated");
                  setSettings(ns_res);
                });
              }}
              value={settings.defaultCalendarDisplay}
            >
              {["Day", "Week", "Month"].map((format) => (
                <option key={format.toLowerCase()} value={format.toLowerCase()}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
