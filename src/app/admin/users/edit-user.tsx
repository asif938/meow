"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateUserAction } from "@/actions/admin";
import { Button, Field, Input, Select, buttonClass } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export function EditUserButton({
  user,
}: {
  user: { id: string; name: string; status: "active" | "banned"; banReason: string | null; isAdmin: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(user.status);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${user.name}`}
        title="Edit"
        className={buttonClass("ghost", "sm", "h-8 w-8 px-0")}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${user.name}`} description="Change account status or admin access.">
        <form
          className="space-y-4"
          action={(fd) =>
            start(async () => {
              await updateUserAction(fd);
              setOpen(false);
            })
          }
        >
          <input type="hidden" name="userId" value={user.id} />
          <Field label="Status" htmlFor={`status-${user.id}`}>
            <Select id={`status-${user.id}`} name="status" value={status} onChange={(e) => setStatus(e.target.value as "active" | "banned")}>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </Select>
          </Field>
          {status === "banned" && (
            <Field label="Ban reason" htmlFor={`reason-${user.id}`} hint="Shown to the user. Their live listings are taken down.">
              <Input id={`reason-${user.id}`} name="reason" defaultValue={user.banReason ?? ""} />
            </Field>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="isAdmin" defaultChecked={user.isAdmin} className="h-4 w-4 accent-brand-600" />
            Administrator access
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" loading={pending}>Save changes</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
