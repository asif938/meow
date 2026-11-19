"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Choice = "light" | "dark" | "system";

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try {
    if (choice === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", choice);
  } catch {
    // Storage blocked: the choice applies for this visit only.
  }
}

/** Three-way theme selector used on the settings page. */
export function ThemePicker() {
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      setChoice(saved === "dark" || saved === "light" ? saved : "system");
    } catch {
      /* ignore */
    }
  }, []);

  const options: { value: Choice; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-2">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          onClick={() => {
            setChoice(value);
            apply(value);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors",
            choice === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line hover:bg-brand-50",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
