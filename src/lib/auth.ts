import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

// Auto-detect URL on Vercel to prevent CSRF mismatches
// On Vercel, VERCEL_URL is auto-set (e.g. "my-app-abc123.vercel.app")
// We only set NEXTAUTH_URL if it's not already explicitly configured
if (process.env.VERCEL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors to login page instead of default error page
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          const isValid = await compare(credentials.password, user.passwordHash);

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          // Re-throw known auth errors (our own thrown errors) — these are user-facing
          if (
            error.message === "Invalid email or password" ||
            error.message === "Email and password are required"
          ) {
            throw error;
          }
          // Database/connection errors should surface clearly
          console.error("Auth database error:", error);
          throw new Error("Server error - please try again later");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  // Enable debug logging only in development
  debug: process.env.NODE_ENV === "development",
};
