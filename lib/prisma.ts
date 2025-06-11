import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Build connection URL with required parameters to fix prepared statement issue
function buildDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) return baseUrl
  
  const url = new URL(baseUrl)
  
  // Add/update required parameters to prevent prepared statement conflicts
  url.searchParams.set('prepared_statements', 'false')
  url.searchParams.set('connection_limit', '1')
  url.searchParams.set('pool_timeout', '0')
  
  return url.toString()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma