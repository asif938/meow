"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

/** A select that updates one URL query param (and resets pagination) on change. */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Select
      {...props}
      className="h-9 w-auto rounded-full text-sm"
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set(props.name, e.target.value);
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`);
      }}
    />
  );
}
