import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../src/lib/db/schema'

async function pushSchemaToNeon() {
  try {
    console.log('🔄 Connexion à Neon...')
    
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql, { schema })
    
    console.log('✅ Connecté à Neon')
    console.log('📋 Le nouveau schéma inclut:')
    console.log('   - Extension de la table employees (auth)')
    console.log('   - Nouvelle table clients')  
    console.log('   - Nouvelle table projects')
    console.log('   - Nouvelle table workspaces')
    console.log('   - Nouvelle table workspace_members')
    console.log('   - Nouvelle table messages')
    console.log('   - Nouvelle table permissions')
    console.log('   - Nouvelle table role_permissions')
    console.log('   - Nouvelle table sessions')
    
    console.log('\n⚠️ IMPORTANT:')
    console.log('   Utilisez la commande suivante pour pousser le schéma:')
    console.log('   npx drizzle-kit push')
    console.log('\n   Ou pour générer et appliquer les migrations:')
    console.log('   npx drizzle-kit generate')
    console.log('   npx drizzle-kit migrate')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  pushSchemaToNeon()
}