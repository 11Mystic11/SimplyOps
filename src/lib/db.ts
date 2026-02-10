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
