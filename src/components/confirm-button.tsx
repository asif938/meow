"use client";

import { useState } from "react";

/** Two-tap confirmation (avoids blocking browser confirm() dialogs). */
export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="text-muted">{message}</span>
      <button type="submit" className="cursor-pointer rounded-full bg-red-600 px-3 py-1.5 font-semibold text-white">
        Yes
      </button>
      <button type="button" className="cursor-pointer text-muted underline" onClick={() => setArmed(false)}>
        Cancel
      </button>
    </span>
  );
}
