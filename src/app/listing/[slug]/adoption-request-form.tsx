"use client";

import { useActionState, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { createAdoptionRequestAction } from "@/actions/adoption";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";

export function AdoptionRequestForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createAdoptionRequestAction, undefined);

  if (state?.ok) return <FormMessage state={state} />;

  if (!open) {
    return (
      <Button variant="teal" size="lg" className="w-full" onClick={() => setOpen(true)}>
        <HeartHandshake className="h-5 w-5" /> Request to adopt
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-teal-50/60 p-4">
      <p className="font-semibold text-teal-900">Adoption request</p>
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <Label htmlFor="a-home">Type of home</Label>
        <Select id="a-home" name="homeType" required defaultValue="">
          <option value="" disabled>Select</option>
          <option>Apartment (with window nets)</option>
          <option>Apartment (no window nets)</option>
          <option>House with yard</option>
          <option>Shared / hostel</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="a-pets">Other pets at home</Label>
        <Input id="a-pets" name="otherPets" placeholder="e.g. 1 neutered male cat" />
      </div>
      <div>
        <Label htmlFor="a-exp">Experience with cats</Label>
        <Textarea id="a-exp" name="experience" required className="min-h-20" placeholder="Have you kept cats before? Vet nearby?" />
      </div>
      <div>
        <Label htmlFor="a-msg">Message to the owner</Label>
        <Textarea id="a-msg" name="message" required placeholder="Why would you like to adopt this cat?" />
      </div>
      <div>
        <Label htmlFor="a-phone">Your phone (shared only if approved)</Label>
        <Input id="a-phone" name="phone" inputMode="tel" placeholder="01XXXXXXXXX" />
      </div>
      <FormMessage state={state} />
      <SubmitButton variant="teal" className="w-full">Send request</SubmitButton>
    </form>
  );
}
