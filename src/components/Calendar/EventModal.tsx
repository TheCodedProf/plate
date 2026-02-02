import { calendarEvents, calendars as calendarsDb } from "@db";
import { Dispatch, SetStateAction, useState } from "react";

import { fromLocalDateTimeValue, toLocalDateTimeValue } from ".";
import { Button } from "../lib/Button";

interface Props {
  calendars: (typeof calendarsDb.$inferSelect)[];
  initialEvent?: Partial<typeof calendarEvents.$inferInsert>;
  setEditorOpen: Dispatch<SetStateAction<boolean>>;
  setLocalEvents: Dispatch<
    SetStateAction<(typeof calendarEvents.$inferSelect & { color: string })[]>
  >;
  setUpdate: Dispatch<SetStateAction<boolean>>;
  view: Date;
}

export function EventModal({
  calendars,
  initialEvent,
  setEditorOpen,
  setLocalEvents,
  setUpdate,
  view,
}: Props) {
  const modInitialEvent = { ...initialEvent };
  if (initialEvent && !modInitialEvent.calendarId) {
    modInitialEvent.calendarId = calendars.find((c) => c.default)!.id;
  }
  if (initialEvent && !modInitialEvent.title) {
    modInitialEvent.title = "";
  }
  const [draft, setDraft] = useState<typeof calendarEvents.$inferInsert>(
    (initialEvent
      ? (modInitialEvent as typeof calendarEvents.$inferInsert)
      : false) || {
      calendarId: calendars.find((c) => c.default)!.id,
      end: new Date(
        view.getFullYear(),
        view.getMonth(),
        view.getDate(),
        new Date().getHours(),
        new Date().getMinutes() + 30,
      ),
      start: new Date(
        view.getFullYear(),
        view.getMonth(),
        view.getDate(),
        new Date().getHours(),
        new Date().getMinutes(),
      ),
      title: "",
    },
  );
  const editorMode = draft.id ? "edit" : "create";

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setEditorOpen(false)}
      />
      <div className="border-ctp-overlay2 bg-ctp-surface0 relative w-130 max-w-[92vw] rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-ctp-text text-lg font-semibold">
            {editorMode === "create" ? "Add event" : "Edit event"}
          </div>
          <button
            aria-label="Close"
            className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer"
            onClick={() => setEditorOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Title</label>
            <input
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text w-full rounded border px-2 py-1"
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, title: e.target.value } : d))
              }
              value={draft.title ?? ""}
            />
          </div>

          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Calendar</label>
            <select
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text h-8.5 w-full rounded border px-2 py-1"
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, calendarId: e.target.value } : d))
              }
              value={draft.calendarId}
            >
              {calendars.map((calendar) => (
                <option
                  className={`bg-ctp-${calendar.color}`}
                  key={calendar.id}
                  value={calendar.id}
                >
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-ctp-subtext1 text-xs">Start</label>
              <input
                className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text w-full rounded border px-2 py-1"
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          start: fromLocalDateTimeValue(e.target.value),
                        }
                      : d,
                  )
                }
                type="datetime-local"
                value={toLocalDateTimeValue(new Date(draft.start))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-ctp-subtext1 text-xs">End</label>
              <input
                className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text w-full rounded border px-2 py-1"
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          end: fromLocalDateTimeValue(e.target.value),
                        }
                      : d,
                  )
                }
                type="datetime-local"
                value={toLocalDateTimeValue(new Date(draft.end))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-ctp-subtext1 text-xs">All Day</label>
            <input
              checked={draft.allDay ?? false}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, allDay: e.target.checked } : d))
              }
              type="checkbox"
            />
          </div>

          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Location</label>
            <textarea
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text max-h-fit w-full rounded border px-2 py-1"
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        location: e.target.value
                          .split("\n")
                          .slice(0, 5) // Max lines for address
                          .join("\n"),
                      }
                    : d,
                )
              }
              rows={draft.location?.split("\n").length || 1}
              value={draft.location ?? ""}
            />
          </div>

          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Notes</label>
            <textarea
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text min-h-22 w-full rounded border px-2 py-1"
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, notes: e.target.value } : d))
              }
              value={draft.notes ?? ""}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="mt-4">
            <Button
              disabled={!draft.id}
              onClick={(e) => {
                if (e.shiftKey && draft.id) {
                  deleteEvent(draft.id, setLocalEvents);
                  setEditorOpen(false);
                } else {
                  setOpenConfirmDelete(true);
                }
              }}
              type="danger"
            >
              Delete
            </Button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button
              disabled={!String(draft.title ?? "").trim()}
              onClick={() =>
                saveEvent(
                  draft,
                  setLocalEvents,
                  setEditorOpen,
                  setUpdate,
                  calendars,
                )
              }
              type="success"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
      {openConfirmDelete && draft.id && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpenConfirmDelete(false)}
          />
          <div className="border-ctp-overlay2 bg-ctp-surface0 relative w-105 max-w-[92vw] rounded-lg border p-4">
            <div className="text-lg font-semibold">Delete event?</div>
            <div className="text-ctp-subtext1 mt-2 text-sm">
              Are you sure you want to delete{" "}
              <span className="text-ctp-text font-semibold">
                {draft?.title ?? "this event"}
              </span>
              ? This can’t be undone.
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setOpenConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteEvent(draft.id!, setLocalEvents);
                  setOpenConfirmDelete(false);
                  setEditorOpen(false);
                }}
                type="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function eventToApiPayload(e: typeof calendarEvents.$inferInsert) {
  return {
    allDay: !!e.allDay,
    calendarId: e.calendarId,
    end: new Date(e.end).toISOString(),
    id: e.id === "" ? null : e.id,
    location: e.location ?? null,
    notes: e.notes ?? null,
    start: new Date(e.start).toISOString(),
    title: e.title,
  };
}

export async function upsertEventRequest(
  event: typeof calendarEvents.$inferInsert,
) {
  let method: string;
  if (event.id) {
    method = "PUT";
  } else {
    method = "POST";
  }
  const res = await fetch("/api/event", {
    body: JSON.stringify(eventToApiPayload(event)),
    method,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request Failed: ${res.status}`);
  }

  return (await res.json()) as typeof calendarsDb.$inferSelect;
}

function deleteEvent(
  id: string,
  setLocalEvents: Dispatch<
    SetStateAction<(typeof calendarEvents.$inferSelect & { color: string })[]>
  >,
) {
  setLocalEvents((prev) => prev.filter((x) => x.id !== id));

  fetch(`/api/event?id=${id}`, {
    method: "DELETE",
  });
}

function saveEvent(
  draft: typeof calendarEvents.$inferInsert,
  setLocalEvents: Dispatch<
    SetStateAction<(typeof calendarEvents.$inferSelect & { color: string })[]>
  >,
  setEditorOpen: Dispatch<SetStateAction<boolean>>,
  setUpdate: Dispatch<SetStateAction<boolean>>,
  calendars: (typeof calendarsDb.$inferSelect)[],
) {
  if (!draft) return;
  console.log(draft);

  const [start, end] = [new Date(draft.start), new Date(draft.end)].sort(
    (a, b) => a.getTime() - b.getTime(),
  );

  const optimistic: typeof calendarEvents.$inferSelect & { color: string } = {
    allDay: draft.allDay || false,
    calendarId: draft.calendarId,
    color:
      calendars.find((c) => c.id === draft.calendarId)?.color || "lavender",
    end,
    id: draft.id ? draft.id : crypto.randomUUID(),
    location: draft.location || null,
    notes: draft.notes || null,
    start,
    title: draft.title,
  };

  setLocalEvents((prev) => {
    const idx = prev.findIndex((e) => e.id === optimistic.id);
    if (idx === -1)
      return [...prev, optimistic].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
    const copy = prev.slice();
    copy[idx] = optimistic;
    return copy.sort((a, b) => +a.start - +b.start);
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    upsertEventRequest(draft).then((_event) => {
      setUpdate((p) => !p);
    });
  } catch (error) {
    console.log(error);
  }
  setEditorOpen(false);
}
