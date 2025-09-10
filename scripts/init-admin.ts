import { db } from '../src/lib/db/neon'
import { employees, departments, positions } from '../src/lib/db/schema'
import bcrypt from 'bcryptjs'
import { initializePermissions } from '../src/lib/permissions'

async function createInitialAdmin() {
  try {
    console.log('🚀 Initialisation de l\'administrateur...')
    
    // Créer un département système
    const [systemDept] = await db
      .insert(departments)
      .values({
        code: 'SYS',
        name: 'Administration Système',
        description: 'Département administratif pour la gestion du système'
      })
      .returning()
      .catch(() => [null]) // Ignore si déjà existant
    
    console.log('✅ Département système créé')
    
    // Créer un poste d'administrateur
    const [adminPosition] = await db
      .insert(positions)
      .values({
        title: 'Administrateur Système',
        code: 'SYS_ADMIN',
        departmentId: systemDept?.id,
        description: 'Administrateur système avec tous les privilèges',
        isManager: true,
        isMedical: false
      })
      .returning()
      .catch(() => [null]) // Ignore si déjà existant
    
    console.log('✅ Poste administrateur créé')
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await db.query.employees.findFirst({
      where: (employees, { eq }) => eq(employees.email, 'admin@medeclipse.com')
    })
    
    if (existingAdmin) {
      console.log('⚠️ L\'administrateur existe déjà')
      return
    }
    
    // Créer le mot de passe hashé
    const passwordHash = await bcrypt.hash('Admin123!', 12)
    
    // Créer l'administrateur
    const [admin] = await db
      .insert(employees)
      .values({
        employeeNumber: 'ADMIN001',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@medeclipse.com',
        passwordHash,
        role: 'super_admin',
        departmentId: systemDept?.id,
        positionId: adminPosition?.id,
        hireDate: new Date(),
        isActive: true,
        emailVerified: true,
      })
      .returning()
    
    console.log('✅ Administrateur créé avec succès')
    console.log(`📧 Email: admin@medeclipse.com`)
    console.log(`🔑 Mot de passe: Admin123!`)
    console.log(`👤 ID: ${admin.id}`)
    
    // Initialiser les permissions
    await initializePermissions()
    console.log('✅ Permissions initialisées')
    
    console.log('\n🎉 Initialisation terminée avec succès!')
    console.log('\n🔐 Vous pouvez maintenant vous connecter avec:')
    console.log('   Email: admin@medeclipse.com')
    console.log('   Mot de passe: Admin123!')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  }
}

// Script principal
if (require.main === module) {
  createInitialAdmin()
    .then(() => {
      console.log('\n✨ Script d\'initialisation terminé')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { createInitialAdmin }