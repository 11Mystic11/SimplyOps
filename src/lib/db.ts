import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL
  console.log("[DB] Initializing Prisma with URL prefix:", url?.split(':')[0])

  // Turso URLs can start with libsql://, https://, or wss://
  const isLibsql = url?.startsWith('libsql:') || url?.startsWith('https:') || url?.startsWith('wss:')

  if (isLibsql) {
    console.log("[DB] Using LibSQL adapter for Turso/Remote connection")
    const libsql = createClient({
      url: url as string,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  console.log("[DB] Falling back to standard Prisma engine (SQLite/File-based)")
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Ensures the user from the session exists in the DB.
 * Useful after DB migrations where session state might point to a missing user.
 */
export async function ensureAuthenticatedUser(session: any) {
  if (!session?.user?.email) return null;

  // Upsert the user based on email to ensure they exist with the current ID from session
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      // Keep existing data but ensure record exists
      name: session.user.name || undefined
    },
    create: {
      id: session.user.id, // Try to keep the ID from session to avoid orphan references
      email: session.user.email,
      name: session.user.name || "User",
    }
  });

  return user;
}
