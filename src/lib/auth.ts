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

        try {
          // Self-healing: Ensure at least the admin user exists in the DB
          if (credentials.email === "admin@simplyops.com") {
            const adminExists = await prisma.user.findUnique({
              where: { email: "admin@simplyops.com" },
            });

            if (!adminExists) {
              console.log("[AUTH] Admin missing from DB, creating...");
              const hashedPassword = await bcrypt.hash("admin123", 10);
              await prisma.user.create({
                data: {
                  email: "admin@simplyops.com",
                  name: "Admin User",
                  password: hashedPassword,
                },
              });
              console.log("[AUTH] Admin user created successfully");
            } else {
              console.log("[AUTH] Admin user found in DB");
            }
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("[AUTH] No user found with this email");
            return null;
          }

          if (!user.password) {
            console.log("[AUTH] User has no password set");
            return null;
          }

          console.log("[AUTH] Comparing passwords...");
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValidPassword) {
            console.log("[AUTH] Invalid password comparison result");
            return null;
          }

          console.log("[AUTH] Authentication successful for:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("[AUTH] Error during authentication:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
