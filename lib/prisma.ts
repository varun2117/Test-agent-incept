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
  url.searchParams.set('statement_cache_size', '0')
  
  return url.toString()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
})

// Helper function to retry database operations with prepared statement error handling
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a prepared statement error
      if (error instanceof Error && error.message.includes('prepared statement') && error.message.includes('already exists')) {
        console.log(`Prepared statement error on attempt ${attempt}, retrying...`)
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        continue
      }
      
      // If it's not a prepared statement error, throw immediately
      throw error
    }
  }
  
  throw lastError
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma