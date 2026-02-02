import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { calendars } from "@/lib/db";

import { Button } from "../lib/Button";

interface Props {
  calendar?: null | typeof calendars.$inferInsert;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUpdate: React.Dispatch<React.SetStateAction<boolean>>;
}

const deleteCalendar = (calendarId: string | undefined) => {
  if (!calendarId) return;

  fetch(`/api/calendar?id=${calendarId}`, {
    method: "DELETE",
  });
};

export function CalendarModal({
  calendar: calendarProp,
  setModalOpen,
  setUpdate,
}: Props) {
  const session = authClient.useSession();
  const [calendar, setCalendar] = useState<typeof calendars.$inferInsert>(
    calendarProp ?? {
      default: false,
      name: "",
      userId: !session.isPending ? session.data!.user.id : "",
    },
  );

  console.log(calendarProp);

  const editorMode = calendarProp ? "edit" : "create";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setModalOpen(false)}
      />
      <div className="border-ctp-overlay2 bg-ctp-surface0 relative w-130 max-w-[92vw] rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-ctp-text text-lg font-semibold">
            {editorMode === "create" ? "Create calendar" : "Edit calendar"}
          </div>
          <button
            aria-label="Close"
            className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer"
            onClick={() => setModalOpen(false)}
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
                setCalendar((d) => ({ ...d, name: e.target.value }))
              }
              value={calendar?.name ?? ""}
            />
          </div>

          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Description</label>
            <textarea
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text min-h-22 w-full rounded border px-2 py-1"
              onChange={(e) =>
                setCalendar((d) =>
                  d ? { ...d, description: e.target.value } : d,
                )
              }
              value={calendar?.description ?? ""}
            />
          </div>

          <div className="space-y-1">
            <label className="text-ctp-subtext1 text-xs">Color</label>
            <select
              className="border-ctp-overlay2 bg-ctp-surface1 text-ctp-text h-8.5 w-full rounded border px-2 py-1"
              onChange={(e) =>
                setCalendar((d) => (d ? { ...d, color: e.target.value } : d))
              }
              value={calendar?.color ?? "lavender"}
            >
              <option value="rosewater">Rosewater</option>
              <option value="flamingo">Flamingo</option>
              <option value="pink">Pink</option>
              <option value="mauve">Mauve</option>
              <option value="red">Red</option>
              <option value="maroon">Maroon</option>
              <option value="peach">Peach</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="teal">Teal</option>
              <option value="sky">Sky</option>
              <option value="sapphire">Sapphire</option>
              <option value="blue">Blue</option>
              <option value="lavender">Lavender</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-ctp-subtext1 text-xs">Default</label>
            <input
              checked={calendar.default}
              onChange={(e) =>
                setCalendar((d) =>
                  d ? { ...d, default: e.target.checked } : d,
                )
              }
              type="checkbox"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="mt-4">
            <Button
              disabled={
                !Object.keys(calendarProp ?? {}).includes("id") ||
                calendar.default
              }
              onClick={() => {
                deleteCalendar(calendarProp?.id);
                setModalOpen(false);
                setUpdate((prev) => !prev);
              }}
              type="danger"
            >
              Delete
            </Button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              disabled={
                !String(calendar?.name ?? "").trim() ||
                JSON.stringify(calendar) === JSON.stringify(calendarProp ?? {})
              }
              onClick={() => {
                upsertCalendar(calendar!);
                setModalOpen(false);
                setUpdate((prev) => !prev);
              }}
              type="success"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function upsertCalendar(calendar: typeof calendars.$inferInsert) {
  let method: string;
  if (Object.keys(calendar).includes("id")) {
    method = "PUT";
  } else {
    method = "POST";
  }
  const res = await fetch("/api/calendar", {
    body: JSON.stringify(calendar),
    method,
  });
  return res.json();
}
