"use client";
// Needed for rendering DateTime in the correct TZ

import { useEffect, useMemo, useState } from "react";

export type RecurrenceType = "daily" | "every_n_days" | "none" | "weekly";

export type Todo = {
  completed: boolean | null;
  description: null | string;
  dueDate: null | string;
  id: string;
  recurrenceIntervalDays?: null | number; // for every_n_days

  // Optional fields if your API/DB supports them later:
  recurrenceType?: null | RecurrenceType;
  recurrenceWeekdays?: null | string[]; // ["mon","tue"...] for weekly
  title: string;
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

function cx(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// "No smoking" overlay: circle (after) + slash (before)
const NO_SMOKING_OVERLAY = cx(
  "relative",
  "cursor-not-allowed opacity-40",
  // Circle
  "after:absolute after:inset-0 after:rounded-full after:border after:border-current after:content-['']",
  // Slash
  "before:absolute before:inset-0 before:rotate-45 before:border-t before:border-current before:content-['']",
);

const getSelectedClass = (selected: boolean) => {
  return selected
    ? "bg-ctp-green text-ctp-base border-ctp-green cursor-pointer"
    : "bg-ctp-base text-ctp-text border-ctp-overlay2 hover:bg-ctp-surface2 cursor-pointer";
};

const getSaveTitle = (
  title: string,
  recurrenceType: RecurrenceType,
  weeklyHasDay: boolean,
) => {
  if (!title.trim().length) {
    return "Title is required";
  }
  if (recurrenceType === "weekly" && !weeklyHasDay) {
    return "Select at least one weekday";
  }
  return "Save changes";
};

export default function TodoItemModal({
  onClose,
  onDelete,
  onSave,
  open,
  todo,
}: {
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (patch: Partial<Todo>) => Promise<void>;
  open: boolean;
  todo: null | Todo;
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
    const next = getModalStateFromTodo(todo);
    setTitle(next.title);
    setDescription(next.description);
    setDue(next.due);
    setCompleted(next.completed);
    setRecurrenceType(next.recurrenceType);
    setIntervalDays(next.intervalDays);
    setWeekdays(next.weekdays);
  }, [todo]);

  // Additional rule: Weekly must have at least 1 weekday selected
  const weeklyHasDay = useMemo(() => {
    if (recurrenceType !== "weekly") return true;
    return Array.isArray(weekdays) && weekdays.length > 0;
  }, [recurrenceType, weekdays]);

  const canSave = useMemo(
    () => title.trim().length > 0 && !busy && weeklyHasDay,
    [title, busy, weeklyHasDay],
  );

  if (!open || !todo) return null;

  async function handleSave() {
    if (!canSave) return;
    setBusy(true);
    try {
      const patch = buildPatch({
        completed,
        description,
        due,
        intervalDays,
        recurrenceType,
        title,
        weekdays,
      });
      await onSave(patch);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy || !todo) return;
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

  // Disabled reasons for tooltips (nice UX)
  const saveTitle = busy
    ? "Saving…"
    : getSaveTitle(title, recurrenceType, weeklyHasDay);

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader busy={busy} onClose={onClose} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ModalLeft
          busy={busy}
          description={description}
          setDescription={setDescription}
          setTitle={setTitle}
          title={title}
        />

        <ModalRight
          busy={busy}
          completed={completed}
          due={due}
          intervalDays={intervalDays}
          recurrenceType={recurrenceType}
          setCompleted={setCompleted}
          setDue={setDue}
          setIntervalDays={setIntervalDays}
          setRecurrenceType={setRecurrenceType}
          toggleWeekday={toggleWeekday}
          weekdays={weekdays}
          weeklyHasDay={weeklyHasDay}
        />
      </div>

      <ModalFooter
        busy={busy}
        canSave={canSave}
        onCancel={onClose}
        onDelete={() => void handleDelete()}
        onSave={() => void handleSave()}
        saveTitle={saveTitle}
      />
    </ModalShell>
  );
}

function buildPatch(input: {
  completed: boolean;
  description: string;
  due: string;
  intervalDays: number;
  recurrenceType: RecurrenceType;
  title: string;
  weekdays: string[];
}): Partial<Todo> {
  return {
    completed: input.completed,
    description: input.description.trim() ?? null,
    dueDate: input.due.trim()
      ? new Date(`${input.due}T00:00:00`).toISOString()
      : null,
    recurrenceIntervalDays:
      input.recurrenceType === "every_n_days" ? input.intervalDays : null,
    recurrenceType: input.recurrenceType,
    recurrenceWeekdays:
      input.recurrenceType === "weekly" ? input.weekdays : null,
    title: input.title.trim(),
  };
}

function getModalStateFromTodo(todo: Todo) {
  const nextTitle = todo.title ?? "";
  const nextDescription = todo.description ?? "";
  const nextDue = toDateInputValue(todo.dueDate);
  const nextCompleted = Boolean(todo.completed);

  const nextRecurrenceType = (todo.recurrenceType as RecurrenceType) ?? "none";
  const nextIntervalDays =
    typeof todo.recurrenceIntervalDays === "number" &&
    todo.recurrenceIntervalDays > 0
      ? todo.recurrenceIntervalDays
      : 2;

  const nextWeekdays =
    Array.isArray(todo.recurrenceWeekdays) && todo.recurrenceWeekdays.length
      ? todo.recurrenceWeekdays
      : ["mon"];

  return {
    completed: nextCompleted,
    description: nextDescription,
    due: nextDue,
    intervalDays: nextIntervalDays,
    recurrenceType: nextRecurrenceType,
    title: nextTitle,
    weekdays: nextWeekdays,
  };
}

function IntervalPicker({
  busy,
  intervalDays,
  setIntervalDays,
}: {
  busy: boolean;
  intervalDays: number;
  setIntervalDays: (v: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="text-ctp-subtext0 pb-2 text-xs">Interval (days)</div>
      <input
        className={cx(
          "border-ctp-overlay2 bg-ctp-base text-ctp-text w-full rounded border px-3 py-2 text-sm outline-none",
          "focus:ring-ctp-overlay2 focus:ring-2",
          busy ? "cursor-not-allowed opacity-60" : "cursor-text",
        )}
        disabled={busy}
        min={1}
        onChange={(e) => setIntervalDays(Number(e.target.value))}
        type="number"
        value={intervalDays}
      />
    </div>
  );
}

function ModalFooter({
  busy,
  canSave,
  onCancel,
  onDelete,
  onSave,
  saveTitle,
}: {
  busy: boolean;
  canSave: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
  saveTitle: string;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button
        aria-disabled={busy}
        className={cx(
          "bg-ctp-red text-ctp-base rounded px-3 py-2 text-sm font-semibold transition",
          busy ? NO_SMOKING_OVERLAY : "cursor-pointer hover:opacity-90",
        )}
        disabled={busy}
        onClick={onDelete}
        title={busy ? "Busy…" : "Delete this task"}
      >
        Delete
      </button>

      <div className="flex items-center gap-2">
        <button
          aria-disabled={busy}
          className={cx(
            "bg-ctp-crust text-ctp-text rounded px-3 py-2 text-sm font-semibold transition",
            busy ? NO_SMOKING_OVERLAY : "hover:bg-ctp-surface2 cursor-pointer",
          )}
          disabled={busy}
          onClick={onCancel}
          title={busy ? "Busy…" : "Cancel"}
        >
          Cancel
        </button>

        <button
          aria-disabled={!canSave}
          className={cx(
            "bg-ctp-green text-ctp-base rounded px-3 py-2 text-sm font-semibold transition",
            canSave ? "cursor-pointer hover:opacity-90" : NO_SMOKING_OVERLAY,
          )}
          disabled={!canSave}
          onClick={onSave}
          title={saveTitle}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ModalHeader({
  busy,
  onClose,
}: {
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between pb-3">
      <h3 className="text-ctp-text text-lg font-semibold">Edit To-Do</h3>
      <button
        aria-disabled={busy}
        className={cx(
          "bg-ctp-crust text-ctp-text rounded px-2 py-1 text-sm font-semibold transition",
          busy ? NO_SMOKING_OVERLAY : "hover:bg-ctp-surface2 cursor-pointer",
        )}
        disabled={busy}
        onClick={onClose}
        title={busy ? "Busy…" : "Close"}
      >
        ✕
      </button>
    </div>
  );
}

function ModalLeft({
  busy,
  description,
  setDescription,
  setTitle,
  title,
}: {
  busy: boolean;
  description: string;
  setDescription: (v: string) => void;
  setTitle: (v: string) => void;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-ctp-text text-sm font-semibold">Title</div>
        <input
          className={cx(
            "border-ctp-overlay2 bg-ctp-base text-ctp-text mt-1 w-full rounded border px-3 py-2 text-sm outline-none",
            "focus:ring-ctp-overlay2 focus:ring-2",
            busy && "cursor-not-allowed opacity-60",
          )}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        />
      </div>

      <div>
        <div className="text-ctp-text text-sm font-semibold">Description</div>
        <textarea
          className={cx(
            "border-ctp-overlay2 bg-ctp-base text-ctp-text mt-1 w-full resize-none rounded border px-3 py-2 text-sm outline-none",
            "focus:ring-ctp-overlay2 focus:ring-2",
            busy && "cursor-not-allowed opacity-60",
          )}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          value={description}
        />
      </div>
    </div>
  );
}

function ModalRight({
  busy,
  completed,
  due,
  intervalDays,
  recurrenceType,
  setCompleted,
  setDue,
  setIntervalDays,
  setRecurrenceType,
  toggleWeekday,
  weekdays,
  weeklyHasDay,
}: {
  busy: boolean;
  completed: boolean;
  due: string;
  intervalDays: number;
  recurrenceType: RecurrenceType;
  setCompleted: (v: ((v: boolean) => boolean) | boolean) => void;
  setDue: (v: string) => void;
  setIntervalDays: (v: number) => void;
  setRecurrenceType: (v: RecurrenceType) => void;
  toggleWeekday: (k: string) => void;
  weekdays: string[];
  weeklyHasDay: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="border-ctp-overlay2 bg-ctp-surface0 flex items-center justify-between rounded border p-3">
        <div>
          <div className="text-ctp-text text-sm font-semibold">Completed</div>
          <div className="text-ctp-subtext0 text-xs">
            Toggle completion state
          </div>
        </div>

        <button
          aria-disabled={busy}
          className={cx(
            "flex h-8 w-8 items-center justify-center rounded border font-bold transition",
            busy ? NO_SMOKING_OVERLAY : "cursor-pointer",
            completed
              ? "bg-ctp-green border-ctp-green text-ctp-base"
              : "border-ctp-overlay2 text-ctp-text bg-transparent",
          )}
          disabled={busy}
          onClick={() => {
            if (busy) return;
            setCompleted((v) => !v);
          }}
          title={busy ? "Busy…" : "Toggle complete"}
        >
          {completed ? "✓" : ""}
        </button>
      </div>

      <div>
        <div className="text-ctp-text text-sm font-semibold">Due date</div>
        <input
          className={cx(
            "border-ctp-overlay2 bg-ctp-base text-ctp-text mt-1 w-full rounded border px-3 py-2 text-sm outline-none",
            "focus:ring-ctp-overlay2 focus:ring-2",
            busy ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
          disabled={busy}
          onChange={(e) => setDue(e.target.value)}
          type="date"
          value={due}
        />
      </div>

      <RecurrencePanel
        busy={busy}
        intervalDays={intervalDays}
        recurrenceType={recurrenceType}
        setIntervalDays={setIntervalDays}
        setRecurrenceType={setRecurrenceType}
        toggleWeekday={toggleWeekday}
        weekdays={weekdays}
        weeklyHasDay={weeklyHasDay}
      />
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="border-ctp-overlay2 bg-ctp-surface1 relative w-[min(820px,92vw)] rounded border p-4 shadow-lg">
        {children}
      </div>
    </div>
  );
}

function RecurrencePanel({
  busy,
  intervalDays,
  recurrenceType,
  setIntervalDays,
  setRecurrenceType,
  toggleWeekday,
  weekdays,
  weeklyHasDay,
}: {
  busy: boolean;
  intervalDays: number;
  recurrenceType: RecurrenceType;
  setIntervalDays: (v: number) => void;
  setRecurrenceType: (v: RecurrenceType) => void;
  toggleWeekday: (k: string) => void;
  weekdays: string[];
  weeklyHasDay: boolean;
}) {
  return (
    <div className="border-ctp-overlay2 bg-ctp-surface0 rounded border p-3">
      <div className="text-ctp-text text-sm font-semibold">Recurrence</div>

      <div className="mt-2">
        <select
          className={cx(
            "border-ctp-overlay2 bg-ctp-base text-ctp-text w-full rounded border px-3 py-2 text-sm outline-none",
            "focus:ring-ctp-overlay2 focus:ring-2",
            busy ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
          disabled={busy}
          onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
          value={recurrenceType}
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="every_n_days">Every # of days</option>
        </select>
      </div>

      {recurrenceType === "weekly" ? (
        <WeeklyPicker
          busy={busy}
          toggleWeekday={toggleWeekday}
          weekdays={weekdays}
          weeklyHasDay={weeklyHasDay}
        />
      ) : null}

      {recurrenceType === "every_n_days" ? (
        <IntervalPicker
          busy={busy}
          intervalDays={intervalDays}
          setIntervalDays={setIntervalDays}
        />
      ) : null}
    </div>
  );
}

function toDateInputValue(dueDate: null | string) {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-mm-dd in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function WeeklyPicker({
  busy,
  toggleWeekday,
  weekdays,
  weeklyHasDay,
}: {
  busy: boolean;
  toggleWeekday: (k: string) => void;
  weekdays: string[];
  weeklyHasDay: boolean;
}) {
  return (
    <div className="mt-3">
      <div className="text-ctp-subtext0 pb-2 text-xs">Choose weekdays</div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => {
          const selected = weekdays.includes(d.key);
          const canClick = !busy;
          return (
            <button
              aria-disabled={!canClick}
              className={cx(
                "rounded border px-2 py-1 text-xs font-semibold transition",
                canClick ? getSelectedClass(selected) : NO_SMOKING_OVERLAY,
              )}
              disabled={!canClick}
              key={d.key}
              onClick={() => {
                if (!canClick) return;
                toggleWeekday(d.key);
              }}
              title={canClick ? "Toggle weekday" : "Busy…"}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div
        className={cx(
          "pt-2 text-xs",
          weeklyHasDay ? "text-ctp-subtext0" : "text-ctp-red",
        )}
      >
        Weekly recurrence requires at least one day selected.
      </div>
    </div>
  );
}
