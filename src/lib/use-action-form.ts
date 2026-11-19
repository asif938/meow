"use client";

import { useActionState, useCallback, useRef, useState, startTransition } from "react";
import type { z } from "zod";
import type { ActionState } from "@/lib/utils";

export type FieldErrors = Record<string, string>;

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Client-side validation + server action in one hook.
 *
 * 1. `onSubmit` validates the form data with the same zod schema the server uses and shows
 *    per-field errors (and focuses the first invalid field).
 * 2. When valid it calls the server action, which validates again (never trust the client).
 * 3. `state` carries the server's error/success message, `pending` drives the loading UI.
 *
 * The form is submitted programmatically instead of via `<form action>` so a failed
 * submit does not wipe what the user typed (React 19 resets action forms).
 */
export function useActionForm<S extends z.ZodType>(
  schema: S,
  action: ServerAction,
  options: { resetOnSuccess?: boolean; transform?: (data: Record<string, FormDataEntryValue>) => Record<string, unknown> } = {},
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const result = await action(prev, fd);
      if (result?.ok && options.resetOnSuccess) formRef.current?.reset();
      return result;
    },
    undefined,
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const raw = Object.fromEntries(fd) as Record<string, FormDataEntryValue>;
      const parsed = schema.safeParse(options.transform ? options.transform(raw) : raw);
      if (!parsed.success) {
        const next: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "form");
          next[key] ??= issue.message;
        }
        setErrors(next);
        form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
        return;
      }
      setErrors({});
      startTransition(() => dispatch(fd));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, dispatch],
  );

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }, []);

  /** Spread onto an input: wires aria attributes and clears the error when the user edits. */
  const fieldProps = (name: string) => ({
    name,
    id: `f-${name}`,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `f-${name}-error` : undefined,
    onChange: () => clearError(name),
  });

  return { state, errors, pending, onSubmit, formRef, fieldProps };
}
