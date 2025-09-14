// Configuration Neon Database
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

// Client Neon pour les requêtes SQL
const sql = neon(process.env.DATABASE_URL)

// Instance Drizzle avec le client Neon et le schéma typé
export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, { schema })

// Type pour les transactions (Neon HTTP ne supporte pas les transactions)
export type DatabaseTransaction = typeof db

// Utilitaire pour les transactions (simulation sans transaction réelle)
export async function withTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  // Note: Neon HTTP driver ne supporte pas les vraies transactions
  // On passe simplement l'instance db normale
  console.warn('⚠️ Neon HTTP driver ne supporte pas les transactions. Opération exécutée sans transaction.')
  return await callback(db)
}