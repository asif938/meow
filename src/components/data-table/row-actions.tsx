"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

const iconBtn = "h-8 w-8 px-0";

export function ViewAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={`View ${label}`} title="View" className={buttonClass("ghost", "sm", iconBtn)}>
      <Eye className="h-4 w-4" />
    </Link>
  );
}

export function EditAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={`Edit ${label}`} title="Edit" className={buttonClass("ghost", "sm", iconBtn)}>
      <Pencil className="h-4 w-4" />
    </Link>
  );
}

/** Delete button that asks for confirmation in a modal, then runs a server action with `{ id }`. */
export function DeleteAction({
  id,
  label,
  action,
  description,
}: {
  id: string;
  label: string;
  action: (formData: FormData) => Promise<void>;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
        title="Delete"
        className={buttonClass("ghost", "sm", `${iconBtn} text-red-600 hover:bg-red-50 dark:text-red-400`)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Delete permanently?"
        description={description ?? `“${label}” will be removed and this cannot be undone.`}
      >
        {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const fd = new FormData();
                fd.set("id", id);
                try {
                  await action(fd);
                  setOpen(false);
                } catch {
                  setError("Could not delete. Please try again.");
                }
              })
            }
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
