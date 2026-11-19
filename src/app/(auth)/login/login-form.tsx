"use client";

import { useRef } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { loginAction } from "@/actions/auth";
import { DEMO_ACCOUNTS, SITE } from "@/lib/constants";
import { loginSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { Button, Field, Input } from "@/components/ui";
import { FormMessage } from "@/components/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(loginSchema, loginAction);
  const [show, setShow] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fillDemo = (email: string, password: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field label="Email" htmlFor="f-email" error={errors.email}>
        <Input {...fieldProps("email")} ref={emailRef} type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="f-password" error={errors.password}>
        <div className="relative">
          <Input {...fieldProps("password")} ref={passwordRef} type={show ? "text" : "password"} autoComplete="current-password" required className="pr-11" />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1 grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>

      {SITE.demoLogin && (
        <div className="rounded-xl border border-dashed border-line p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Just exploring? Fill in demo credentials:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <Button key={a.email} type="button" variant="outline" size="sm" onClick={() => fillDemo(a.email, a.password)}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
