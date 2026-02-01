"use client";

import { useEffect, useState } from "react";

export type CompletionBehavior = "crossout" | "hide";

export type TodoWidgetSettings = {
  completionBehavior: CompletionBehavior;
};

const DEFAULTS: TodoWidgetSettings = {
  completionBehavior: "crossout",
};

const STORAGE_KEY = "capstone:todoWidgetSettings";

export function loadTodoWidgetSettings(): TodoWidgetSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function TodoSettingsModal({
  open,
  onClose,
  settings,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  settings: TodoWidgetSettings;
  onSave: (settings: TodoWidgetSettings) => void;
}) {
  const [local, setLocal] = useState<TodoWidgetSettings>(settings);

  useEffect(() => setLocal(settings), [settings]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[min(720px,92vw)] rounded border border-ctp-overlay2 bg-ctp-surface1 p-4 shadow-lg">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-semibold text-ctp-text">To-Do Settings</h3>
          <button
            onClick={onClose}
            className="rounded bg-ctp-crust px-2 py-1 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-ctp-overlay2 bg-ctp-surface0 p-3">
            <div className="text-sm font-semibold text-ctp-text">
              Completed item behavior
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() =>
                  setLocal((s) => ({ ...s, completionBehavior: "crossout" }))
                }
                className={[
                  "rounded px-3 py-2 text-sm font-semibold transition border",
                  local.completionBehavior === "crossout"
                    ? "bg-ctp-green text-ctp-base border-ctp-green"
                    : "bg-ctp-base text-ctp-text border-ctp-overlay2 hover:bg-ctp-surface2",
                ].join(" ")}
              >
                Cross out
              </button>
              <button
                onClick={() =>
                  setLocal((s) => ({ ...s, completionBehavior: "hide" }))
                }
                className={[
                  "rounded px-3 py-2 text-sm font-semibold transition border",
                  local.completionBehavior === "hide"
                    ? "bg-ctp-green text-ctp-base border-ctp-green"
                    : "bg-ctp-base text-ctp-text border-ctp-overlay2 hover:bg-ctp-surface2",
                ].join(" ")}
              >
                Disappear
              </button>
            </div>
            <div className="pt-2 text-xs text-ctp-subtext0">
              “Disappear” hides completed items in the widget view (they still
              exist and can be edited if you keep another view later).
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="rounded bg-ctp-crust px-3 py-2 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(local)}
            className="rounded bg-ctp-green px-3 py-2 text-sm font-semibold text-ctp-base hover:opacity-90 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
