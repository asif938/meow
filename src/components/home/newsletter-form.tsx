"use client";

import { subscribeNewsletterAction } from "@/actions/content";
import { newsletterSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { Button, Input } from "@/components/ui";

export function NewsletterForm() {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(newsletterSchema, subscribeNewsletterAction, {
    resetOnSuccess: true,
  });
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="f-email" className="sr-only">Email address</label>
          <Input {...fieldProps("email")} type="email" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <Button type="submit" size="lg" loading={pending} className="h-11">
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {errors.email && <p id="f-email-error" className="text-red-600 dark:text-red-400">{errors.email}</p>}
        {state?.error && !errors.email && <p className="text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.message && <p className="text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
