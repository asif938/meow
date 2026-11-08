import { NextResponse } from "next/server";
import type { ActionState } from "./utils";

export function toFormData(obj: Record<string, unknown>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) fd.set(k, String(v));
  return fd;
}

export function actionResponse(res: ActionState) {
  return NextResponse.json(res ?? { ok: true }, { status: res?.error ? 400 : 200 });
}
