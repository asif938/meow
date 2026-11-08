"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LayoutDashboard, Loader2, LogOut, MessageCircle, Shield, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function UserMenu({
  name,
  avatar,
  isAdmin,
  labels,
}: {
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  labels: { dashboard: string; account: string; messages: string; admin: string; logout: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-brand-50";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
        <span className="sr-only">Open account menu</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 rounded-2xl border border-line bg-white p-1.5 shadow-xl"
          onClick={(e) => {
            // Close only on link clicks. Unmounting on the logout click would
            // remove the <form> before the browser submits it.
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <p className="truncate px-3 py-2 text-xs text-muted">{name}</p>
          <Link href="/dashboard" className={item} role="menuitem">
            <LayoutDashboard className="h-4 w-4" />
            {labels.dashboard}
          </Link>
          <Link href="/messages" className={item} role="menuitem">
            <MessageCircle className="h-4 w-4" />
            {labels.messages}
          </Link>
          <Link href="/account" className={item} role="menuitem">
            <User className="h-4 w-4" />
            {labels.account}
          </Link>
          {isAdmin && (
            <Link href="/admin" className={item} role="menuitem">
              <Shield className="h-4 w-4" />
              {labels.admin}
            </Link>
          )}
          <form action={logoutAction}>
            <LogoutButton className={`${item} cursor-pointer text-red-600 disabled:opacity-60`} label={labels.logout} />
          </form>
        </div>
      )}
    </div>
  );
}

function LogoutButton({ className, label }: { className: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} role="menuitem" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {label}
    </button>
  );
}
