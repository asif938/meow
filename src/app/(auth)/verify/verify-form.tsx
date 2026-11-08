"use client";

import { useActionState } from "react";
import { sendPhoneOtpAction, verifyPhoneOtpAction } from "@/actions/auth";
import { Input, Label } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";

export function VerifyPhoneForm({ next }: { next?: string }) {
  const [sendState, send] = useActionState(sendPhoneOtpAction, undefined);
  const [verifyState, verify] = useActionState(verifyPhoneOtpAction, undefined);

  return (
    <div className="space-y-6">
      <form action={send} className="space-y-3">
        <div>
          <Label htmlFor="phone">Mobile number</Label>
          <div className="flex gap-2">
            <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" required />
            <SubmitButton variant="outline" className="h-11 shrink-0">
              {sendState?.ok ? "Resend" : "Send code"}
            </SubmitButton>
          </div>
        </div>
        <FormMessage state={sendState} />
      </form>

      {sendState?.ok && (
        <form action={verify} className="space-y-3">
          <input type="hidden" name="next" value={next ?? "/"} />
          <div>
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>
          <FormMessage state={verifyState} />
          <SubmitButton size="lg" className="w-full">Verify</SubmitButton>
        </form>
      )}
    </div>
  );
}
