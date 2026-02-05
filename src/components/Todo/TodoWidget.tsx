"use client";
// Needed for rendering DateTime in the correct TZ

import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { settings as settingsDb } from "@/lib/db";

import TodoItemModal, { Todo } from "./TodoItemModal";
import TodoSettingsModal from "./TodoSettingsModal";

type TodosSnapshot = { todos: Todo[] };

let snapshot: TodosSnapshot = { todos: [] };
const listeners = new Set<() => void>();

function applyCompletionFilter(
  todos: Todo[],
  behavior: (typeof settingsDb.$inferSelect)["completionBehavior"],
) {
  if (behavior !== "hide") return todos;
  return todos.filter((t) => !t.completed);
}

function buildPatchRequest(patch: unknown): RequestInit {
  return {
    body: JSON.stringify(patch),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  };
}

function compareTodos(a: Todo, b: Todo) {
  const ac = Boolean(a.completed);
  const bc = Boolean(b.completed);
  if (ac !== bc) return ac ? 1 : -1;

  const ad = toDueTimestamp(a.dueDate);
  const bd = toDueTimestamp(b.dueDate);
  if (ad !== bd) return ad - bd;

  return a.title.localeCompare(b.title);
}

function cx(...classes: Array<false | null | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function emit() {
  for (const l of listeners) l();
}

async function fetchTodosIntoStore() {
  try {
    const res = await fetch("/api/todos");
    const data = await res.json();
    const next = { todos: Array.isArray(data) ? (data as Todo[]) : [] };

    startTransition(() => {
      snapshot = next;
      emit();
    });
  } catch (e) {
    console.warn(e);
    startTransition(() => {
      snapshot = { todos: [] };
      emit();
    });
  }
}

function formatDue(dueDate: null | string) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function getServerSnapshot(): TodosSnapshot {
  return { todos: [] };
}

function getSnapshot(): TodosSnapshot {
  return snapshot;
}

function isWeeklyRecurrenceInvalid(patch: Partial<Todo>) {
  if (patch.recurrenceType !== "weekly") return false;
  const days = patch.recurrenceWeekdays ?? [];
  return days.length === 0;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toDueTimestamp(dueDate: null | string) {
  if (!dueDate) return Number.POSITIVE_INFINITY;
  const t = new Date(dueDate).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
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
  const { todos } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState(""); // yyyy-mm-dd

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selected, setSelected] = useState<null | Todo>(null);
  const [itemOpen, setItemOpen] = useState(false);

  const loadTodos = useCallback(async () => {
    await fetchTodosIntoStore();
  }, []);

  const sorted = useMemo(() => {
    const filtered = applyCompletionFilter(todos, settings.completionBehavior);
    return filtered.toSorted(compareTodos);
  }, [todos, settings.completionBehavior]);

  const trimmedTitle = newTitle.trim();
  const canAdd = trimmedTitle.length > 0;

  const openItem = useCallback((todo: Todo) => {
    setSelected(todo);
    setItemOpen(true);
  }, []);

  async function createTodo() {
    if (!canAdd) return;

    const dueDate =
      newDue.trim() === "" ? null : new Date(`${newDue}T00:00:00`);

    const res = await fetch("/api/todos", {
      body: JSON.stringify({ dueDate, title: trimmedTitle }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!res.ok) return;

    setNewTitle("");
    setNewDue("");
    await loadTodos();
  }

  async function toggle(todo: Todo) {
    const res = await fetch(
      `/api/todo?id=${encodeURIComponent(todo.id)}`,
      buildPatchRequest({ completed: !todo.completed }),
    );

    if (!res.ok) return;
    await loadTodos();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/todo?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) return;
    await loadTodos();
  }

  async function saveFromModal(patch: Partial<Todo>) {
    if (!selected) return;
    if (isWeeklyRecurrenceInvalid(patch)) return;

    const res = await fetch(
      `/api/todo?id=${encodeURIComponent(selected.id)}`,
      buildPatchRequest(patch),
    );

    if (!res.ok) return;
    await loadTodos();
  }

  async function deleteFromModal(id: string) {
    await remove(id);
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (!canAdd) return;
    void createTodo();
  }

  function handleToggleClick(e: React.MouseEvent, t: Todo) {
    e.stopPropagation();
    void toggle(t);
  }

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    void remove(id);
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
              onClick={() => void loadTodos()}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex gap-2 pb-3">
          <input
            className={cx(
              "border-ctp-overlay2 bg-ctp-base flex-1 rounded border px-3 py-2 text-sm",
              "text-ctp-text placeholder:text-ctp-subtext0 outline-none",
              "focus:ring-ctp-overlay2 focus:ring-2",
            )}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleAddKeyDown}
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
            onClick={() => void createTodo()}
            title={canAdd ? "Add task" : "Enter a task title to enable Add"}
          >
            Add
          </button>
        </div>

        <div className="border-ctp-overlay2 bg-ctp-surface0 max-h-full flex-1 overflow-x-hidden overflow-y-scroll rounded border">
          {sorted.length === 0 ? (
            <div className="text-ctp-subtext0 p-4 text-sm">
              No tasks yet. Add one above.
            </div>
          ) : (
            <ul className="divide-ctp-overlay2 divide-y">
              {sorted.map((t) => {
                const due = formatDue(t.dueDate);

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
                    <button
                      aria-label="Toggle complete"
                      className={cx(
                        "flex h-5 w-5 cursor-pointer items-center justify-center rounded border",
                        t.completed
                          ? "bg-ctp-green border-ctp-green text-ctp-base"
                          : "border-ctp-overlay2 text-ctp-text bg-transparent",
                      )}
                      onClick={(e) => handleToggleClick(e, t)}
                      title="Toggle complete"
                    >
                      {t.completed ? "✓" : ""}
                    </button>

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

                      <div className="text-ctp-subtext0 text-xs">
                        {due ? `Due ${due}` : "No due date"}
                      </div>
                    </div>

                    <button
                      className={cx(
                        "bg-ctp-crust text-ctp-text rounded px-2 py-1 text-xs font-semibold transition",
                        "hover:bg-ctp-surface2 cursor-pointer",
                      )}
                      onClick={(e) => handleDeleteClick(e, t.id)}
                      title="Delete"
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
