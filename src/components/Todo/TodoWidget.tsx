"use client";

import { useEffect, useMemo, useState } from "react";
import TodoItemModal, { Todo, RecurrenceType } from "./TodoItemModal";
import TodoSettingsModal, {
  loadTodoWidgetSettings,
  saveTodoWidgetSettings,
  TodoWidgetSettings,
} from "./TodoSettingsModal";

function formatDue(dueDate: string | null) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState(""); // yyyy-mm-dd

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<TodoWidgetSettings>({
    completionBehavior: "crossout",
  });

  const [selected, setSelected] = useState<Todo | null>(null);
  const [itemOpen, setItemOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSettings(loadTodoWidgetSettings());
    void refresh();
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

      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;

      return a.title.localeCompare(b.title);
    });
  }, [todos, settings.completionBehavior]);

  async function createTodo() {
    const title = newTitle.trim();
    if (!title) return;

    const dueDate =
      newDue.trim() !== "" ? new Date(`${newDue}T00:00:00`) : null;

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate }),
    });

    if (!res.ok) return;

    setNewTitle("");
    setNewDue("");
    await refresh();
  }

  async function toggle(todo: Todo) {
    const res = await fetch(`/api/todo?id=${encodeURIComponent(todo.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
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
        className={[
          "col-span-4 row-span-2",
          "rounded border border-ctp-overlay2 bg-ctp-surface1 p-4",
          "flex flex-col overflow-hidden",
        ].join(" ")}
      >
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold text-ctp-text">To-Do</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded bg-ctp-crust px-3 py-1 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
              title="Settings"
            >
              Settings
            </button>
            <button
              onClick={() => void refresh()}
              className="rounded bg-ctp-crust px-3 py-1 text-sm font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Add row */}
        <div className="flex gap-2 pb-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text placeholder:text-ctp-subtext0 outline-none focus:ring-2 focus:ring-ctp-overlay2"
            onKeyDown={(e) => {
              if (e.key === "Enter") void createTodo();
            }}
          />
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="rounded border border-ctp-overlay2 bg-ctp-base px-3 py-2 text-sm text-ctp-text outline-none focus:ring-2 focus:ring-ctp-overlay2"
          />
          <button
            onClick={() => void createTodo()}
            className="rounded bg-ctp-green px-3 py-2 text-sm font-semibold text-ctp-base hover:opacity-90 transition"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto rounded border border-ctp-overlay2 bg-ctp-surface0">
          {loading ? (
            <div className="p-4 text-sm text-ctp-subtext0">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="p-4 text-sm text-ctp-subtext0">
              No tasks yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y divide-ctp-overlay2">
              {sorted.map((t) => {
                const due = formatDue(t.dueDate);

                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 p-3 hover:bg-ctp-surface2/40 transition cursor-pointer"
                    onClick={() => openItem(t)}
                  >
                    {/* Stop row click when using these buttons */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggle(t);
                      }}
                      className={[
                        "h-5 w-5 rounded border flex items-center justify-center",
                        t.completed
                          ? "bg-ctp-green border-ctp-green text-ctp-base"
                          : "bg-transparent border-ctp-overlay2 text-ctp-text",
                      ].join(" ")}
                      aria-label="Toggle complete"
                      title="Toggle complete"
                    >
                      {t.completed ? "✓" : ""}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        className={[
                          "truncate text-sm font-semibold",
                          t.completed && settings.completionBehavior === "crossout"
                            ? "text-ctp-subtext0 line-through"
                            : "text-ctp-text",
                        ].join(" ")}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                      {due ? (
                        <div className="text-xs text-ctp-subtext0">Due {due}</div>
                      ) : (
                        <div className="text-xs text-ctp-subtext0">No due date</div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void remove(t.id);
                      }}
                      className="rounded bg-ctp-crust px-2 py-1 text-xs font-semibold text-ctp-text hover:bg-ctp-surface2 transition"
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
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          saveTodoWidgetSettings(s);
          setSettingsOpen(false);
        }}
      />

      <TodoItemModal
        open={itemOpen}
        todo={selected}
        onClose={() => setItemOpen(false)}
        onSave={saveFromModal}
        onDelete={deleteFromModal}
      />
    </>
  );
}
