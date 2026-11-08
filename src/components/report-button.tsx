"use client";

import Link from "next/link";
import { Flag, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createReportAction } from "@/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import { Label, Select, Textarea, buttonClass } from "@/components/ui";
import { FormMessage, SubmitButton } from "./submit-button";

export function ReportButton({
  targetType,
  targetId,
  loggedIn,
}: {
  targetType: "listing" | "user";
  targetId: string;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createReportAction, undefined);

  if (!loggedIn) {
    return (
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-red-600">
        <Flag className="h-4 w-4" /> Report this {targetType}
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-red-600"
      >
        <Flag className="h-4 w-4" /> Report this {targetType}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Report">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Report {targetType}</h2>
              <button onClick={() => setOpen(false)} className={buttonClass("ghost", "icon")} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {state?.ok ? (
              <div className="space-y-4">
                <FormMessage state={state} />
                <button onClick={() => setOpen(false)} className={buttonClass("outline", "md", "w-full")}>Close</button>
              </div>
            ) : (
              <form action={action} className="space-y-4">
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="targetId" value={targetId} />
                <div>
                  <Label htmlFor="r-reason">Reason</Label>
                  <Select id="r-reason" name="reason" required defaultValue="">
                    <option value="" disabled>Choose a reason</option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="r-details">Details (optional)</Label>
                  <Textarea id="r-details" name="details" maxLength={1000} placeholder="What happened?" />
                </div>
                <FormMessage state={state} />
                <SubmitButton variant="danger" className="w-full">Submit report</SubmitButton>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
