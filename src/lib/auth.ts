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
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // Self-healing: Ensure at least the admin user exists in the DB
        // This is useful for first-time deployments on Vercel where seed might not have run
        if (credentials.email === "admin@simplyops.com") {
          const adminExists = await prisma.user.findUnique({
            where: { email: "admin@simplyops.com" },
          });

          if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await prisma.user.create({
              data: {
                email: "admin@simplyops.com",
                name: "Admin User",
                password: hashedPassword,
              },
            });
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
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
