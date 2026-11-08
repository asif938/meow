"use client";

import { memo, useState } from "react";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "@/lib/hooks";
import { Input } from "@/components/ui";

/**
 * State colocation: the raw text lives HERE, so each keystroke re-renders only this tiny input.
 * The parent (and its 1,000-row list) is only told about the value after the user pauses typing.
 */
export const SearchBox = memo(function SearchBox({
  onSearch,
  placeholder,
  label,
  className,
  delay = 250,
}: {
  onSearch: (q: string) => void;
  placeholder: string;
  label: string;
  className?: string;
  delay?: number;
}) {
  const [text, setText] = useState("");
  const commit = useDebouncedCallback(onSearch, delay);
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <Input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        className="pl-10"
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
      />
    </div>
  );
});
