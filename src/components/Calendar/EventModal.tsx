import { calendarEvents, calendars } from "@db";
import { fromLocalDateTimeValue, toLocalDateTimeValue } from ".";
import { Button } from "../lib/Button";
import { Dispatch, SetStateAction, useState } from "react";

interface Props {
  initialEvent?: Partial<typeof calendarEvents.$inferInsert>;
  setEditorOpen: Dispatch<SetStateAction<boolean>>;
  calendars: (typeof calendars.$inferSelect)[];
  setLocalEvents: Dispatch<
    SetStateAction<(typeof calendarEvents.$inferSelect & { color: string })[]>
  >;
  view: Date;
  setUpdate: Dispatch<SetStateAction<boolean>>;
}

export function eventToApiPayload(e: typeof calendarEvents.$inferInsert) {
  return {
    id: e.id === "" ? null : e.id,
    title: e.title,
    start: new Date(e.start).toISOString(),
    end: new Date(e.end).toISOString(),
    allDay: !!e.allDay,
    notes: e.notes ?? null,
    location: e.location ?? null,
    calendarId: e.calendarId,
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
    method,
    body: JSON.stringify(eventToApiPayload(event)),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request Failed: ${res.status}`);
  }

  return (await res.json()) as typeof calendars.$inferSelect;
}

function saveEvent(
  draft: typeof calendarEvents.$inferInsert,
  setLocalEvents: Dispatch<
    SetStateAction<(typeof calendarEvents.$inferSelect & { color: string })[]>
  >,
  setEditorOpen: Dispatch<SetStateAction<boolean>>,
  setUpdate: Dispatch<SetStateAction<boolean>>,
) {
  if (!draft) return;
  console.log(draft);

  const [start, end] = [new Date(draft.start), new Date(draft.end)].sort(
    (a, b) => a.getTime() - b.getTime(),
  );

  const optimistic: typeof calendarEvents.$inferSelect & { color: string } = {
    id: draft.id ? draft.id : crypto.randomUUID(),
    title: draft.title,
    start,
    end,
    allDay: draft.allDay || false,
    notes: draft.notes || null,
    location: draft.location || null,
    calendarId: draft.calendarId,
    color: "lavender",
  };

  setLocalEvents((prev) => {
    const idx = prev.findIndex((e) => e.id === optimistic.id);
    if (idx === -1)
      return [...prev, optimistic].sort(
        (a, b) => a.start.getTime() - b.start.getTime(),
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

export function EventModal({
  initialEvent,
  setEditorOpen,
  calendars,
  view,
  setLocalEvents,
  setUpdate,
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
      title: "",
      start: new Date(
        view.getFullYear(),
        view.getMonth(),
        view.getDate(),
        new Date().getHours(),
        new Date().getMinutes(),
      ),
      end: new Date(
        view.getFullYear(),
        view.getMonth(),
        view.getDate(),
        new Date().getHours(),
        new Date().getMinutes() + 30,
      ),
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
      <div className="relative w-130 max-w-[92vw] rounded-lg border border-ctp-overlay2 bg-ctp-surface0 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-lg font-semibold text-ctp-text">
            {editorMode === "create" ? "Add event" : "Edit event"}
          </div>
          <button
            className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer"
            onClick={() => setEditorOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Title</label>
            <input
              className="w-full rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
              value={draft.title ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, title: e.target.value } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Calendar</label>
            <select
              className="w-full rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text h-8.5"
              value={draft.calendarId}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, calendarId: e.target.value } : d))
              }
            >
              {calendars.map((calendar) => (
                <option
                  value={calendar.id}
                  className={`bg-ctp-${calendar.color}`}
                  key={calendar.id}
                >
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-ctp-subtext1">Start</label>
              <input
                type="datetime-local"
                className="w-full rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
                value={toLocalDateTimeValue(new Date(draft.start))}
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
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-ctp-subtext1">End</label>
              <input
                type="datetime-local"
                className="w-full rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
                value={toLocalDateTimeValue(new Date(draft.end))}
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
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-ctp-subtext1">All Day</label>
            <input
              type="checkbox"
              checked={draft.allDay ?? false}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, allDay: e.target.checked } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Location</label>
            <textarea
              rows={draft.location?.split("\n").length || 1}
              className="w-full max-h-fit rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
              value={draft.location ?? ""}
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
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Notes</label>
            <textarea
              className="w-full min-h-22 rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
              value={draft.notes ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, notes: e.target.value } : d))
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="mt-4">
            <Button
              onClick={() => setOpenConfirmDelete(true)}
              type="danger"
              disabled={!draft.id}
            >
              Delete
            </Button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button
              type="success"
              onClick={() =>
                saveEvent(draft, setLocalEvents, setEditorOpen, setUpdate)
              }
              disabled={!String(draft.title ?? "").trim()}
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
          <div className="relative w-105 max-w-[92vw] rounded-lg border border-ctp-overlay2 bg-ctp-surface0 p-4">
            <div className="text-lg font-semibold">Delete event?</div>
            <div className="mt-2 text-sm text-ctp-subtext1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-ctp-text">
                {draft?.title ?? "this event"}
              </span>
              ? This can’t be undone.
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setOpenConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                type="danger"
                onClick={() => {
                  deleteEvent(draft.id!, setLocalEvents);
                  setOpenConfirmDelete(false);
                  setEditorOpen(false);
                }}
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
