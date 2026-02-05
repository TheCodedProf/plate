"use client";

import { settings as settingsDb } from "@db";
import { Dispatch, SetStateAction } from "react";

import { updateSettings } from "@/lib/settingsDb";

export type CompletionBehavior = "crossout" | "hide";

export type TodoWidgetSettings = {
  completionBehavior: CompletionBehavior;
};

const DEFAULTS: TodoWidgetSettings = {
  completionBehavior: "crossout",
};

const STORAGE_KEY = "capstone:todoWidgetSettings";

export function loadTodoWidgetSettings(): TodoWidgetSettings {
  if (globalThis.window === undefined) return DEFAULTS;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<TodoWidgetSettings>;
    const completionBehavior =
      parsed.completionBehavior === "hide" ? "hide" : "crossout";
    return { completionBehavior };
  } catch {
    return DEFAULTS;
  }
}

export function saveTodoWidgetSettings(settings: TodoWidgetSettings) {
  if (globalThis.window === undefined) return;
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function cx(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const optionBase =
  "rounded px-3 py-2 text-sm font-semibold transition border cursor-pointer";

export default function TodoSettingsModal({
  onClose,
  open,
  setSettings,
  settings,
}: {
  onClose: () => void;
  open: boolean;
  setSettings: Dispatch<SetStateAction<null | typeof settingsDb.$inferSelect>>;
  settings: typeof settingsDb.$inferSelect;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="border-ctp-overlay2 bg-ctp-surface1 relative w-[min(720px,92vw)] rounded border p-4 shadow-lg">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-ctp-text text-lg font-semibold">
            To-Do Settings
          </h3>

          <button
            className={cx(
              "bg-ctp-crust text-ctp-text rounded px-2 py-1 text-sm font-semibold transition",
              "hover:bg-ctp-surface2 cursor-pointer",
            )}
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-ctp-surface0 rounded-lg p-3">
            <div className="text-ctp-subtext0 font-semibold underline underline-offset-4">
              Completed item behavior
            </div>

            <div className="flex gap-2 pt-2">
              {/* Cross out */}
              <button
                className={optionClass(
                  settings.completionBehavior === "crossout",
                )}
                onClick={() => {
                  updateSettings({
                    ...settings,
                    completionBehavior: "crossout",
                  }).then((cf_set) => {
                    setSettings(cf_set);
                  });
                }}
                type="button"
              >
                Cross out
              </button>

              <button
                className={optionClass(settings.completionBehavior === "hide")}
                onClick={() => {
                  updateSettings({
                    ...settings,
                    completionBehavior: "hide",
                  }).then((cf_set) => {
                    setSettings(cf_set);
                  });
                }}
                type="button"
              >
                Disappear
              </button>
            </div>

            <div className="text-ctp-subtext0 pt-2 text-xs">
              “Disappear” hides completed items in the widget view (they still
              exist and can be edited if you keep another view later).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function optionClass(selected: boolean) {
  return cx(
    optionBase,
    selected
      ? "bg-ctp-green text-ctp-base border-ctp-green"
      : "bg-ctp-surface1 text-ctp-text border-ctp-overlay2 hover:bg-ctp-surface2",
  );
}
