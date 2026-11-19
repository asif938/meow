"use client";

import Link from "next/link";
import { LayoutDashboard, MessageCircle, Package, Settings, Shield, User } from "lucide-react";
import { Dropdown, dropdownItem } from "@/components/ui/dropdown";

/** Profile dropdown shown in the navbar for signed-in users. */
export function UserMenu({
  name,
  email,
  avatar,
  isAdmin,
  labels,
}: {
  name: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
  labels: { dashboard: string; profile: string; account: string; messages: string; admin: string; settings: string };
}) {
  return (
    <Dropdown
      label={labels.profile}
      caret
      triggerClassName="h-10 rounded-xl px-1.5 hover:bg-brand-50"
      trigger={
        <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
      }
    >
      <div className="border-b border-line px-3 pb-2 pt-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>
      <div className="pt-1.5">
        <Link href="/dashboard" className={dropdownItem} role="menuitem"><LayoutDashboard className="h-4 w-4" />{labels.dashboard}</Link>
        <Link href="/dashboard/profile" className={dropdownItem} role="menuitem"><User className="h-4 w-4" />{labels.profile}</Link>
        <Link href="/account" className={dropdownItem} role="menuitem"><Package className="h-4 w-4" />{labels.account}</Link>
        <Link href="/messages" className={dropdownItem} role="menuitem"><MessageCircle className="h-4 w-4" />{labels.messages}</Link>
        <Link href="/dashboard/settings" className={dropdownItem} role="menuitem"><Settings className="h-4 w-4" />{labels.settings}</Link>
        {isAdmin && (
          <Link href="/admin" className={dropdownItem} role="menuitem"><Shield className="h-4 w-4" />{labels.admin}</Link>
        )}
      </div>
    </Dropdown>
  );
}
