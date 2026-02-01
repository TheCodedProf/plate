"use client";

import { useEffect, useMemo, useState } from "react";

export type RecurrenceType = "none" | "daily" | "weekly" | "every_n_days";

export type Todo = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean | null;

  // Optional fields if your API/DB supports them later:
  recurrenceType?: RecurrenceType | null;
  recurrenceIntervalDays?: number | null; // for every_n_days
  recurrenceWeekdays?: string[] | null; // ["mon","tue"...] for weekly
};

const WEEKDAYS: { key: string; label: string }[] = [
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
];

function toDateInputValue(dueDate: string | null) {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-mm-dd in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TodoItemModal({
  open,
  todo,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  todo: Todo | null;
  onClose: () => void;
  onSave: (patch: Partial<Todo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [due, setDue] = useState<string>(""); // yyyy-mm-dd
  const [completed, setCompleted] = useState(false);

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("none");
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [weekdays, setWeekdays] = useState<string[]>(["mon"]);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!todo) return;
    setTitle(todo.title ?? "");
    setDescription(todo.description ?? "");
    setDue(toDateInputValue(todo.dueDate));
    setCompleted(Boolean(todo.completed));

    setRecurrenceType((todo.recurrenceType as RecurrenceType) ?? "none");
    setIntervalDays(
      typeof todo.recurrenceIntervalDays === "number" && todo.recurrenceIntervalDays > 0
        ? todo.recurrenceIntervalDays
        : 2,
    );
    setWeekdays(Array.isArray(todo.recurrenceWeekdays) && todo.recurrenceWeekdays.length
      ? todo.recurrenceWeekdays
      : ["mon"]);
  }, [todo]);

  const canSave = useMemo(() => title.trim().length > 0 && !busy, [title, busy]);

  if (!open || !todo) return null;

  async function handleSave() {
    if (!canSave) return;
    setBusy(true);
    try {
      const patch: Partial<Todo> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        completed,
        dueDate: due.trim() ? new Date(`${due}T00:00:00`).toISOString() : null,
        recurrenceType,
        recurrenceIntervalDays: recurrenceType === "every_n_days" ? intervalDays : null,
        recurrenceWeekdays: recurrenceType === "weekly" ? weekdays : null,
      };
      await onSave(patch);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(todo.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function toggleWeekday(key: string) {
    setWeekdays((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[min(820px,92vw)] rounded border border-ctp-overlay2 bg-ctp-surface1 p-4 shadow-lg">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-semibold text-ctp-text">Edit To-Do</h3>
          <button
            onClick={onClose}
            className="rounded bg-ctp-crust px-2 py-1 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left */}
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-ctp-text">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-ctp-text">
                Description
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1 w-full resize-none rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded border border-ctp-overlay2 bg-ctp-surface0 p-3">
              <div>
                <div className="text-sm font-semibold text-ctp-text">
                  Completed
                </div>
                <div className="text-xs text-ctp-subtext0">
                  Toggle completion state
                </div>
              </div>
              <button
                onClick={() => setCompleted((v) => !v)}
                className={[
                  "h-8 w-8 rounded border flex items-center justify-center font-bold",
                  completed
                    ? "bg-ctp-green border-ctp-green text-ctp-base"
                    : "bg-transparent border-ctp-overlay2 text-ctp-text",
                ].join(" ")}
                title="Toggle complete"
              >
                {completed ? "✓" : ""}
              </button>
            </div>

            <div>
              <div className="text-sm font-semibold text-ctp-text">Due date</div>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="mt-1 w-full rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
              />
            </div>

            <div className="rounded border border-ctp-overlay2 bg-ctp-surface0 p-3">
              <div className="text-sm font-semibold text-ctp-text">
                Recurrence
              </div>

              <div className="mt-2">
                <select
                  value={recurrenceType}
                  onChange={(e) =>
                    setRecurrenceType(e.target.value as RecurrenceType)
                  }
                  className="w-full rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="every_n_days">Every # of days</option>
                </select>
              </div>

              {recurrenceType === "weekly" ? (
                <div className="mt-3">
                  <div className="text-xs text-ctp-subtext0 pb-2">
                    Choose weekdays
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => toggleWeekday(d.key)}
                        className={[
                          "rounded px-2 py-1 text-xs font-semibold transition border",
                          weekdays.includes(d.key)
                            ? "bg-ctp-green text-ctp-base border-ctp-green"
                            : "bg-ctp-base text-ctp-text border-ctp-overlay2 hover:bg-ctp-surface2",
                        ].join(" ")}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 text-xs text-ctp-subtext0">
                    Weekly recurrence requires at least one day selected.
                  </div>
                </div>
              ) : null}

              {recurrenceType === "every_n_days" ? (
                <div className="mt-3">
                  <div className="text-xs text-ctp-subtext0 pb-2">
                    Interval (days)
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                    className="w-full rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => void handleDelete()}
            disabled={busy}
            className="rounded bg-ctp-red px-3 py-2 text-sm font-semibold text-ctp-base hover:opacity-90 disabled:opacity-60 transition"
          >
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded bg-ctp-crust px-3 py-2 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 disabled:opacity-60 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!canSave}
              className="rounded bg-ctp-green px-3 py-2 text-sm font-semibold text-ctp-base hover:opacity-90 disabled:opacity-60 transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
