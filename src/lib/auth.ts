import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Login attempt for:", credentials?.email);

        if (!credentials?.email || !credentials.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        // HARDCODED BYPASS for Admin User (As requested)
        if (credentials.email === "admin@simplyops.com" && credentials.password === "admin123") {
          console.log("[AUTH] Admin bypass triggered: Success");
          return {
            id: "admin-bypass-id",
            name: "Admin Fixed",
            email: "admin@simplyops.com",
          };
        }

        try {
          // Standard DB authentication (fallback)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            console.log("[AUTH] No user found in DB or missing password");
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValidPassword) {
            console.log("[AUTH] Invalid password comparison result");
            return null;
          }

          console.log("[AUTH] DB Authentication successful for:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("[AUTH] DB Connection Error (Bypass active):", error);
          // If DB fails, we already checked the hardcoded credentials above
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
