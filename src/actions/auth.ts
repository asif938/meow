"use server";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { signIn, signOut } from "@/lib/auth";
import { createUser } from "@/lib/users";
import { registerSchema } from "@/lib/validation";
import { normalizeBdPhone } from "@/lib/moderation";
import { sendSms } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/utils";

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "An account with this email already exists. Try logging in." };

  await createUser({ name, email, passwordHash: await bcrypt.hash(password, 10) });

  try {
    await signIn("credentials", { email, password, redirectTo: "/verify" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Account created, but we could not sign you in." };
    throw err; // NEXT_REDIRECT
  }
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeNext(formData.get("next")),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      if (code === "banned") return { error: "This account has been suspended. Contact support to appeal." };
      return { error: "Wrong email or password." };
    }
    throw err;
  }
}

export async function googleLoginAction(formData: FormData) {
  await signIn("google", { redirectTo: safeNext(formData.get("next")) });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

/* ------------------------------ Phone OTP ------------------------------ */

const OTP_TTL_MIN = 10;
const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

export async function sendPhoneOtpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/verify");
  const phone = normalizeBdPhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)." };

  const taken = await db.user.findFirst({
    where: { phone, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) return { error: "This number is already linked to another account." };

  // Throttle: one code per minute.
  const recent = await db.otpCode.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return { error: "Please wait a minute before requesting another code." };

  const code = String(crypto.randomInt(100000, 1000000));
  await db.otpCode.create({
    data: {
      userId: user.id,
      channel: "phone",
      target: phone,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000),
    },
  });
  await sendSms(phone, `Your Meow verification code is ${code}. It expires in ${OTP_TTL_MIN} minutes.`);
  return { ok: true, message: `We sent a 6-digit code to ${phone}.` };
}

export async function verifyPhoneOtpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/verify");
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const otp = await db.otpCode.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { error: "Code expired. Request a new one." };
  if (otp.attempts >= 5) return { error: "Too many attempts. Request a new code." };

  if (otp.codeHash !== hashCode(code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { error: "Incorrect code." };
  }

  await db.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  await db.user.update({ where: { id: user.id }, data: { phone: otp.target, isPhoneVerified: true } });
  redirect(safeNext(formData.get("next")) === "/" ? "/account?verified=1" : safeNext(formData.get("next")));
}
