"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted">
        Please try again. If this keeps happening, let us know{error.digest ? ` (ref ${error.digest})` : ""}.
      </p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
