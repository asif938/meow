"use client";

import { lazy, Suspense, type ComponentProps } from "react";

// The form pulls in the Cloudinary uploader and server-action plumbing; keep it out of the page's initial JS.
const VerificationForm = lazy(() => import("./verification-form").then((m) => ({ default: m.VerificationForm })));

export function LazyVerificationForm(props: ComponentProps<typeof VerificationForm>) {
  return (
    <Suspense
      fallback={
        // Reserve the form's approximate height so nothing jumps when it streams in (no CLS).
        <div className="animate-pulse space-y-4" style={{ minHeight: 440 }} aria-busy="true" aria-label="Loading form">
          <div className="h-11 rounded-xl bg-stone-100" />
          <div className="h-11 rounded-xl bg-stone-100" />
          <div className="h-28 rounded-xl bg-stone-100" />
          <div className="h-11 w-40 rounded-full bg-stone-100" />
        </div>
      }
    >
      <VerificationForm {...props} />
    </Suspense>
  );
}
