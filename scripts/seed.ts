// Script de génération de données de test
import { db } from '@/lib/db/neon'
import { departments, positions, employees } from '@/lib/db/schema'

async function seedDatabase() {
  try {
    console.log('🌱 Génération des données de test...')

    // 1. Créer les départements
    console.log('📋 Création des départements...')
    const departmentsData = [
      {
        code: 'CARD',
        name: 'Cardiologie',
        description: 'Service de cardiologie et chirurgie cardiaque'
      },
      {
        code: 'URG',
        name: 'Urgences',
        description: 'Service des urgences médicales'
      },
      {
        code: 'MED',
        name: 'Médecine Générale',
        description: 'Service de médecine générale'
      },
      {
        code: 'CHIR',
        name: 'Chirurgie',
        description: 'Service de chirurgie générale'
      },
      {
        code: 'ADM',
        name: 'Administration',
        description: 'Services administratifs et RH'
      }
    ]

    const createdDepartments = await db.insert(departments).values(departmentsData).returning()
    console.log(`✅ ${createdDepartments.length} départements créés`)

    // 2. Créer les postes
    console.log('💼 Création des postes...')
    const positionsData = [
      // Cardiologie
      {
        title: 'Cardiologue Senior',
        code: 'CARD_SEN',
        departmentId: createdDepartments[0].id,
        description: 'Cardiologue avec plus de 10 ans d\'expérience',
        isManager: true,
        isMedical: true
      },
      {
        title: 'Cardiologue Junior',
        code: 'CARD_JUN',
        departmentId: createdDepartments[0].id,
        description: 'Cardiologue en début de carrière',
        isManager: false,
        isMedical: true
      },
      // Urgences
      {
        title: 'Médecin Urgentiste',
        code: 'URG_MED',
        departmentId: createdDepartments[1].id,
        description: 'Médecin spécialisé en médecine d\'urgence',
        isManager: false,
        isMedical: true
      },
      {
        title: 'Chef de Service Urgences',
        code: 'URG_CHEF',
        departmentId: createdDepartments[1].id,
        description: 'Responsable du service des urgences',
        isManager: true,
        isMedical: true
      },
      // Médecine Générale
      {
        title: 'Médecin Généraliste',
        code: 'MED_GEN',
        departmentId: createdDepartments[2].id,
        description: 'Médecin de médecine générale',
        isManager: false,
        isMedical: true
      },
      // Chirurgie
      {
        title: 'Chirurgien',
        code: 'CHIR_GEN',
        departmentId: createdDepartments[3].id,
        description: 'Chirurgien généraliste',
        isManager: false,
        isMedical: true
      },
      // Administration
      {
        title: 'Responsable RH',
        code: 'ADM_RH',
        departmentId: createdDepartments[4].id,
        description: 'Responsable des ressources humaines',
        isManager: true,
        isMedical: false
      },
      {
        title: 'Assistant Administratif',
        code: 'ADM_ASS',
        departmentId: createdDepartments[4].id,
        description: 'Assistant administratif',
        isManager: false,
        isMedical: false
      }
    ]

    const createdPositions = await db.insert(positions).values(positionsData).returning()
    console.log(`✅ ${createdPositions.length} postes créés`)

    // 3. Créer les employés
    console.log('👥 Création des employés...')
    const employeesData = [
      // Cardiologie
      {
        employeeNumber: 'CARD20240001',
        firstName: 'Dr. Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@medeclipse.com',
        phone: '0123456789',
        dateOfBirth: new Date('1975-05-15'),
        address: {
          street: '123 Rue de la Santé',
          city: 'Paris',
          postalCode: '75013',
          country: 'FR'
        },
        emergencyContact: {
          name: 'Pierre Dubois',
          relationship: 'Époux',
          phone: '0987654321'
        },
        hireDate: new Date('2015-03-01'),
        departmentId: createdDepartments[0].id,
        positionId: createdPositions[0].id, // Cardiologue Senior
        medicalLicenseNumber: 'MED123456789',
        licenseExpiry: new Date('2025-12-31'),
        status: 'active'
      },
      {
        employeeNumber: 'CARD20240002',
        firstName: 'Dr. Jean',
        lastName: 'Martin',
        email: 'jean.martin@medeclipse.com',
        phone: '0123456790',
        dateOfBirth: new Date('1985-08-22'),
        address: {
          street: '45 Avenue des Médecins',
          city: 'Lyon',
          postalCode: '69001',
          country: 'FR'
        },
        emergencyContact: {
          name: 'Sophie Martin',
          relationship: 'Épouse',
          phone: '0987654322'
        },
        hireDate: new Date('2020-09-15'),
        departmentId: createdDepartments[0].id,
        positionId: createdPositions[1].id, // Cardiologue Junior
        medicalLicenseNumber: 'MED987654321',
        licenseExpiry: new Date('2026-06-30'),
        status: 'active'
      },
      // Urgences
      {
        employeeNumber: 'URG20240001',
        firstName: 'Dr. Sarah',
        lastName: 'Lefebvre',
        email: 'sarah.lefebvre@medeclipse.com',
        phone: '0123456791',
        dateOfBirth: new Date('1980-11-10'),
        address: {
          street: '78 Boulevard de l\'Urgence',
          city: 'Marseille',
          postalCode: '13001',
          country: 'FR'
        },
        emergencyContact: {
          name: 'Marc Lefebvre',
          relationship: 'Époux',
          phone: '0987654323'
        },
        hireDate: new Date('2018-01-20'),
        departmentId: createdDepartments[1].id,
        positionId: createdPositions[3].id, // Chef de Service Urgences
        medicalLicenseNumber: 'MED456789123',
        licenseExpiry: new Date('2025-09-30'),
        status: 'active'
      },
      // Administration
      {
        employeeNumber: 'ADM20240001',
        firstName: 'Claire',
        lastName: 'Rousseau',
        email: 'claire.rousseau@medeclipse.com',
        phone: '0123456792',
        dateOfBirth: new Date('1982-03-25'),
        address: {
          street: '12 Rue de l\'Administration',
          city: 'Toulouse',
          postalCode: '31000',
          country: 'FR'
        },
        emergencyContact: {
          name: 'Paul Rousseau',
          relationship: 'Époux',
          phone: '0987654324'
        },
        hireDate: new Date('2019-06-01'),
        departmentId: createdDepartments[4].id,
        positionId: createdPositions[6].id, // Responsable RH
        status: 'active'
      }
    ]

    const createdEmployees = await db.insert(employees).values(employeesData).returning()
    console.log(`✅ ${createdEmployees.length} employés créés`)

    console.log('🎉 Données de test générées avec succès!')
    console.log(`
📊 Résumé:
- ${createdDepartments.length} départements
- ${createdPositions.length} postes  
- ${createdEmployees.length} employés

🚀 Vous pouvez maintenant:
1. Lancer l'application avec "npm run dev"
2. Visualiser les données avec "npm run db:studio"
3. Tester les APIs sur http://localhost:3000/api/v1/hr/employees
    `)

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error)
    throw error
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default seedDatabase