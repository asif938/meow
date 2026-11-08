"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Input, Label } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full">Create account</SubmitButton>
    </form>
  );
}
