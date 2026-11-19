"use client";

import { Loader2, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

function Inner({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("inline-flex cursor-pointer items-center gap-2 disabled:opacity-60", className)}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {label}
    </button>
  );
}

export function LogoutButton({ label, className }: { label: string; className?: string }) {
  return (
    <form action={logoutAction}>
      <Inner label={label} className={className} />
    </form>
  );
}
