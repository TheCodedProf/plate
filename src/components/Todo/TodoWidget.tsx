"use client";
// Needed for rendering DateTime in the correct TZ

import { useEffect, useMemo, useState } from "react";

import { settings as settingsDb } from "@/lib/db";

import TodoItemModal, { Todo } from "./TodoItemModal";
import TodoSettingsModal from "./TodoSettingsModal";

function cx(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDue(dueDate: null | string) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

const NO_SMOKING_OVERLAY = cx("relative", "cursor-not-allowed opacity-40");

export default function TodoWidget({
  setSettings,
  settings,
}: {
  setSettings: React.Dispatch<
    React.SetStateAction<null | typeof settingsDb.$inferSelect>
  >;
  settings: typeof settingsDb.$inferSelect;
}) {
  const [todos, setTodos] = useState<Todo[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState(""); // yyyy-mm-dd

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selected, setSelected] = useState<null | Todo>(null);
  const [itemOpen, setItemOpen] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => res.json())
      .then((data) => {
        setTodos(Array.isArray(data) ? data : []);
      })
      .catch(console.warn);
  }, []);

  const sorted = useMemo(() => {
    const filtered =
      settings.completionBehavior === "hide"
        ? todos.filter((t) => !t.completed)
        : todos;

    // Incomplete first, then earliest due date first, then title
    return [...filtered].sort((a, b) => {
      const ac = Boolean(a.completed);
      const bc = Boolean(b.completed);
      if (ac !== bc) return ac ? 1 : -1;

      const ad = a.dueDate
        ? new Date(a.dueDate).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.dueDate
        ? new Date(b.dueDate).getTime()
        : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;

      return a.title.localeCompare(b.title);
    });
  }, [todos, settings]);

  const canAdd = newTitle.trim().length > 0;

  async function createTodo() {
    const title = newTitle.trim();
    if (!title) return;

    const dueDate =
      newDue.trim() !== "" ? new Date(`${newDue}T00:00:00`) : null;

    const res = await fetch("/api/todos", {
      body: JSON.stringify({ dueDate, title }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!res.ok) return;

    setNewTitle("");
    setNewDue("");
    await refresh();
  }

  async function toggle(todo: Todo) {
    const res = await fetch(`/api/todo?id=${encodeURIComponent(todo.id)}`, {
      body: JSON.stringify({ completed: !todo.completed }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    if (!res.ok) return;
    await refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/todo?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) return;
    await refresh();
  }

  async function saveFromModal(patch: Partial<Todo>) {
    if (!selected) return;

    // Weekly recurrence needs at least one weekday
    if (
      patch.recurrenceType === "weekly" &&
      (!patch.recurrenceWeekdays || patch.recurrenceWeekdays.length === 0)
    ) {
      return;
    }

    const res = await fetch(`/api/todo?id=${encodeURIComponent(selected.id)}`, {
      body: JSON.stringify(patch),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    if (!res.ok) return;
    await refresh();
  }

  async function deleteFromModal(id: string) {
    await remove(id);
  }

  function openItem(todo: Todo) {
    setSelected(todo);
    setItemOpen(true);
  }

  return (
    <>
      <section
        className={cx(
          "max-h-full min-h-full max-w-full min-w-full",
          "border-ctp-overlay2 bg-ctp-surface1 rounded border p-4",
          "flex flex-col overflow-hidden",
        )}
      >
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-ctp-text text-lg font-semibold">To-Do</h2>
          <div className="flex items-center gap-2">
            <button
              className={cx(
                "bg-ctp-crust text-ctp-text rounded px-3 py-1 text-sm font-semibold",
                "hover:bg-ctp-surface2 cursor-pointer transition",
              )}
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              Settings
            </button>

            <button
              className={cx(
                "bg-ctp-crust text-ctp-text rounded px-3 py-1 text-sm font-semibold",
                "hover:bg-ctp-surface2 cursor-pointer transition",
              )}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Add row */}
        <div className="flex gap-2 pb-3">
          <input
            className={cx(
              "border-ctp-overlay2 bg-ctp-base flex-1 rounded border px-3 py-2 text-sm",
              "text-ctp-text placeholder:text-ctp-subtext0 outline-none",
              "focus:ring-ctp-overlay2 focus:ring-2",
            )}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) void createTodo();
            }}
            placeholder="Add a task…"
            value={newTitle}
          />

          <input
            className={cx(
              "border-ctp-overlay2 bg-ctp-base rounded border px-3 py-2 text-sm",
              "text-ctp-text focus:ring-ctp-overlay2 outline-none focus:ring-2",
              "cursor-pointer",
            )}
            onChange={(e) => setNewDue(e.target.value)}
            type="date"
            value={newDue}
          />

          <button
            aria-disabled={!canAdd}
            className={cx(
              "bg-ctp-green text-ctp-base rounded px-3 py-2 text-sm font-semibold transition",
              canAdd ? "cursor-pointer hover:opacity-90" : NO_SMOKING_OVERLAY,
            )}
            disabled={!canAdd}
            onClick={() => {
              if (canAdd) void createTodo();
            }}
            title={canAdd ? "Add task" : "Enter a task title to enable Add"}
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="border-ctp-overlay2 bg-ctp-surface0 max-h-full flex-1 overflow-x-hidden overflow-y-scroll rounded border">
          {sorted.length === 0 ? (
            <div className="text-ctp-subtext0 p-4 text-sm">
              No tasks yet. Add one above.
            </div>
          ) : (
            <ul className="divide-ctp-overlay2 divide-y">
              {sorted.map((t) => {
                const due = formatDue(t.dueDate);

                // If you later want to disable these conditionally, flip these booleans.
                const canToggle = true;
                const canDelete = true;

                return (
                  <li
                    className={cx(
                      "flex items-center gap-3 p-3 transition",
                      "hover:bg-ctp-surface2/40",
                      "cursor-pointer",
                    )}
                    key={t.id}
                    onClick={() => openItem(t)}
                    title="Open task"
                  >
                    {/* Toggle complete */}
                    <button
                      aria-disabled={!canToggle}
                      aria-label="Toggle complete"
                      className={cx(
                        "flex h-5 w-5 items-center justify-center rounded border",
                        canToggle ? "cursor-pointer" : NO_SMOKING_OVERLAY,
                        t.completed
                          ? "bg-ctp-green border-ctp-green text-ctp-base"
                          : "border-ctp-overlay2 text-ctp-text bg-transparent",
                      )}
                      disabled={!canToggle}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canToggle) return;
                        void toggle(t);
                      }}
                      title={canToggle ? "Toggle complete" : "Not available"}
                    >
                      {t.completed ? "✓" : ""}
                    </button>

                    {/* Text block: default cursor so only row/controls feel clickable */}
                    <div className="min-w-0 flex-1 cursor-default">
                      <div
                        className={cx(
                          "truncate text-sm font-semibold",
                          t.completed &&
                            settings.completionBehavior === "crossout"
                            ? "text-ctp-subtext0 line-through"
                            : "text-ctp-text",
                        )}
                        title={t.title}
                      >
                        {t.title}
                      </div>

                      {due ? (
                        <div className="text-ctp-subtext0 text-xs">
                          Due {due}
                        </div>
                      ) : (
                        <div className="text-ctp-subtext0 text-xs">
                          No due date
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      aria-disabled={!canDelete}
                      className={cx(
                        "bg-ctp-crust text-ctp-text rounded px-2 py-1 text-xs font-semibold transition",
                        canDelete
                          ? "hover:bg-ctp-surface2 cursor-pointer"
                          : NO_SMOKING_OVERLAY,
                      )}
                      disabled={!canDelete}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canDelete) return;
                        void remove(t.id);
                      }}
                      title={canDelete ? "Delete" : "Not available"}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <TodoSettingsModal
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        setSettings={setSettings}
        settings={settings}
      />

      <TodoItemModal
        onClose={() => setItemOpen(false)}
        onDelete={deleteFromModal}
        onSave={saveFromModal}
        open={itemOpen}
        todo={selected}
      />
    </>
  );
}
