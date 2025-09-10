// Configuration Neon Database
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { config } from 'dotenv'

// config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

// Client Neon pour les requêtes SQL
const sql = neon(process.env.DATABASE_URL)

// Instance Drizzle avec le client Neon
export const db : any = drizzle(sql as any)

// Utilitaire pour les transactions
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx : any) => {
    return await callback(tx)
  })
}