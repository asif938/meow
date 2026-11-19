"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { registerSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { cn } from "@/lib/utils";
import { Button, Field, Input } from "@/components/ui";
import { FormMessage } from "@/components/submit-button";

const RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "A letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { label: "A number", test: (v: string) => /\d/.test(v) },
];

export function RegisterForm() {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(registerSchema, registerAction);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const pwProps = fieldProps("password");

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Full name" htmlFor="f-name" error={errors.name}>
        <Input {...fieldProps("name")} autoComplete="name" required minLength={2} />
      </Field>
      <Field label="Email" htmlFor="f-email" error={errors.email}>
        <Input {...fieldProps("email")} type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="f-password" error={errors.password}>
        <div className="relative">
          <Input
            {...pwProps}
            onChange={(e) => {
              pwProps.onChange();
              setPassword(e.target.value);
            }}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1 grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Password requirements">
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.label} className={cn("flex items-center gap-1", ok ? "text-emerald-700" : "text-muted")}>
                <Check className={cn("h-3 w-3", !ok && "opacity-30")} aria-hidden /> {r.label}
              </li>
            );
          })}
        </ul>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
