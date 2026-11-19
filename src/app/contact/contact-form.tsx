"use client";

import { submitContactAction } from "@/actions/content";
import { contactSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { FormMessage } from "@/components/submit-button";

export function ContactForm({ defaultName, defaultEmail }: { defaultName?: string; defaultEmail?: string }) {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(contactSchema, submitContactAction, {
    resetOnSuccess: true,
  });
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="f-name" error={errors.name}>
          <Input {...fieldProps("name")} defaultValue={defaultName} autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="f-email" error={errors.email}>
          <Input {...fieldProps("email")} defaultValue={defaultEmail} type="email" autoComplete="email" required />
        </Field>
      </div>
      <Field label="Subject" htmlFor="f-subject" error={errors.subject}>
        <Input {...fieldProps("subject")} required />
      </Field>
      <Field label="Message" htmlFor="f-message" error={errors.message} hint="At least 20 characters.">
        <Textarea {...fieldProps("message")} className="min-h-36" required />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
