import { useState } from "react";
import { Button } from "../lib/Button";
import { calendars } from "@/lib/db";
import { authClient } from "@/lib/auth-client";

interface Props {
  calendar?: typeof calendars.$inferInsert;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const deleteCalendar = (calendarId: string | undefined) => {
  if (!calendarId) return;

  fetch(`/api/calendar`, {
    method: "DELETE",
    body: JSON.stringify({ id: calendarId }),
  });
};

async function upsertCalendar(calendar: typeof calendars.$inferInsert) {
  let method: string;
  if (Object.keys(calendar).includes("id")) {
    method = "PUT";
  } else {
    method = "POST";
  }
  const res = await fetch("/api/calendar", {
    method,
    body: JSON.stringify(calendar),
  });
  return res.json();
}

export function CalendarModal({ setModalOpen, calendar: calendarProp }: Props) {
  const session = authClient.useSession();
  const [calendar, setCalendar] = useState<typeof calendars.$inferInsert>(
    calendarProp ?? {
      userId: !session.isPending ? session.data!.user.id : "",
      name: "",
      default: false,
    },
  );

  const editorMode = calendarProp ? "edit" : "create";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setModalOpen(false)}
      />
      <div className="relative w-130 max-w-[92vw] rounded-lg border border-ctp-overlay2 bg-ctp-surface0 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-lg font-semibold text-ctp-text">
            {editorMode === "create" ? "Create calendar" : "Edit calendar"}
          </div>
          <button
            className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer"
            onClick={() => setModalOpen(false)}
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
              value={calendar?.name ?? ""}
              onChange={(e) =>
                setCalendar((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Description</label>
            <textarea
              className="w-full min-h-22 rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
              value={calendar?.description ?? ""}
              onChange={(e) =>
                setCalendar((d) =>
                  d ? { ...d, description: e.target.value } : d,
                )
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ctp-subtext1">Color</label>
            <select
              className="w-full rounded border border-ctp-overlay2 bg-ctp-surface1 px-2 py-1 text-ctp-text"
              value={calendar?.color ?? "lavendar"}
              onChange={(e) =>
                setCalendar((d) => (d ? { ...d, color: e.target.value } : d))
              }
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
            <label className="text-xs text-ctp-subtext1">Default</label>
            <input
              type="checkbox"
              checked={calendar.default}
              onChange={(e) =>
                setCalendar((d) =>
                  d ? { ...d, default: e.target.checked } : d,
                )
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="mt-4">
            <Button
              onClick={() => deleteCalendar(calendarProp?.id)}
              type="danger"
              disabled={!calendarProp}
            >
              Delete
            </Button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              type="success"
              onClick={() => {
                upsertCalendar(calendar!);
                setModalOpen(false);
              }}
              disabled={!String(calendar?.name ?? "").trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
