import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { loginSchema } from "./validation";
import { createUser } from "./users";

class BannedError extends CredentialsSignin {
  code = "banned";
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (user.status === "banned") throw new BannedError();
        return { id: user.id, name: user.name, email: user.email, image: user.avatar };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      const existing = await db.user.findUnique({ where: { email } });
      if (existing?.status === "banned") return "/login?error=banned";
      if (!existing) {
        await createUser({
          name: user.name ?? email.split("@")[0],
          email,
          avatar: user.image ?? null,
          isEmailVerified: true,
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On sign-in, store our own user id (Google's id is the provider account id).
      if (user && account) {
        const email = (user.email ?? token.email ?? "").toLowerCase();
        const row = await db.user.findUnique({ where: { email }, select: { id: true } });
        if (row) token.uid = row.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});
