"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction, updateProfileAction } from "@/actions/account";
import { passwordChangeSchema, profileSchema } from "@/lib/validation";
import { useActionForm } from "@/lib/use-action-form";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { FormMessage } from "@/components/submit-button";

export function ProfileForm({ name, bio, shopName, hasShop }: { name: string; bio: string; shopName: string; hasShop: boolean }) {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(profileSchema, updateProfileAction);
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Full name" htmlFor="f-name" error={errors.name}>
        <Input {...fieldProps("name")} defaultValue={name} autoComplete="name" required />
      </Field>
      {hasShop && (
        <>
          <Field label="Shop / organisation name" htmlFor="f-shopName" error={errors.shopName}>
            <Input {...fieldProps("shopName")} defaultValue={shopName} />
          </Field>
          <Field label="Bio" htmlFor="f-bio" error={errors.bio} hint="Shown on your public seller page.">
            <Textarea {...fieldProps("bio")} defaultValue={bio} className="min-h-24" />
          </Field>
        </>
      )}
      <FormMessage state={state} />
      <Button type="submit" loading={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { state, errors, pending, onSubmit, formRef, fieldProps } = useActionForm(passwordChangeSchema, changePasswordAction, {
    resetOnSuccess: true,
  });
  const [show, setShow] = useState(false);
  const type = show ? "text" : "password";
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      {hasPassword ? (
        <Field label="Current password" htmlFor="f-currentPassword" error={errors.currentPassword}>
          <Input {...fieldProps("currentPassword")} type={type} autoComplete="current-password" required />
        </Field>
      ) : (
        <p className="text-sm text-muted">You signed up with Google, so you can set a password to also log in with your email.</p>
      )}
      <Field label="New password" htmlFor="f-newPassword" error={errors.newPassword} hint="8+ characters with a letter and a number.">
        <Input {...fieldProps("newPassword")} type={type} autoComplete="new-password" required />
      </Field>
      <Field label="Confirm new password" htmlFor="f-confirmPassword" error={errors.confirmPassword}>
        <Input {...fieldProps("confirmPassword")} type={type} autoComplete="new-password" required />
      </Field>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {show ? "Hide" : "Show"} passwords
      </button>
      <FormMessage state={state} />
      <Button type="submit" loading={pending}>{pending ? "Updating…" : "Update password"}</Button>
    </form>
  );
}
