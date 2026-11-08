"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/seller";
import { Field, Input, Textarea } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";

export function ProfileForm({ name, bio, shopName, hasShop }: { name: string; bio: string; shopName: string; hasShop: boolean }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Name" htmlFor="p-name">
        <Input id="p-name" name="name" defaultValue={name} required />
      </Field>
      {hasShop && (
        <>
          <Field label="Shop / organisation name" htmlFor="p-shop">
            <Input id="p-shop" name="shopName" defaultValue={shopName} />
          </Field>
          <Field label="Bio" htmlFor="p-bio">
            <Textarea id="p-bio" name="bio" defaultValue={bio} className="min-h-20" />
          </Field>
        </>
      )}
      <FormMessage state={state} />
      <SubmitButton size="sm">Save</SubmitButton>
    </form>
  );
}
