import 'dotenv/config';
import { db } from '@/lib/db/neon';
import { employees, clients, departments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('🔄 Création d\'un utilisateur test...');
    
    // 1. Créer un département test s'il n'existe pas
    let department;
    try {
      const existingDept = await db
        .select()
        .from(departments)
        .where(eq(departments.name, 'IT Test'))
        .limit(1);
      
      if (existingDept.length > 0) {
        department = existingDept[0];
        console.log('✅ Département trouvé:', department.name);
      } else {
        const [newDept] = await db
          .insert(departments)
          .values({
            name: 'IT Test',
            description: 'Département IT pour les tests',
          })
          .returning();
        department = newDept;
        console.log('✅ Département créé:', department.name);
      }
    } catch (error) {
      console.log('⚠️  Erreur département, utilisation d\'un ID par défaut');
      department = { id: 'default-dept-id' };
    }
    
    // 2. Hacher le mot de passe
    const password = 'test123456';
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 3. Créer l'employé test
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.email, 'test@example.com'))
        .limit(1);
      
      if (existingEmployee.length > 0) {
        // Mettre à jour le mot de passe
        await db
          .update(employees)
          .set({ 
            passwordHash,
            updatedAt: new Date()
          })
          .where(eq(employees.id, existingEmployee[0].id));
        
        console.log('✅ Employé mis à jour:');
        console.log('   📧 Email: test@example.com');
        console.log('   🔑 Mot de passe:', password);
      } else {
        // Créer nouvel employé
        const [newEmployee] = await db
          .insert(employees)
          .values({
            employeeNumber: 'TEST001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@example.com',
            passwordHash,
            role: 'employee',
            departmentId: department.id,
            isActive: true,
            emailVerified: true,
            hireDate: new Date(),
          })
          .returning();
        
        console.log('✅ Employé créé:');
        console.log('   📧 Email:', newEmployee.email);
        console.log('   👤 Nom:', newEmployee.firstName, newEmployee.lastName);
        console.log('   🔑 Mot de passe:', password);
        console.log('   🎭 Rôle:', newEmployee.role);
      }
    } catch (error) {
      console.error('❌ Erreur création employé:', error.message);
    }
    
    // 4. Créer un client test
    try {
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.contactEmail, 'client@testcompany.com'))
        .limit(1);
      
      if (existingClient.length > 0) {
        // Mettre à jour le mot de passe
        await db
          .update(clients)
          .set({ 
            passwordHash,
            updatedAt: new Date()
          })
          .where(eq(clients.id, existingClient[0].id));
        
        console.log('✅ Client mis à jour:');
        console.log('   📧 Email: client@testcompany.com');
        console.log('   🔑 Mot de passe:', password);
      } else {
        const [newClient] = await db
          .insert(clients)
          .values({
            companyName: 'Test Company SARL',
            contactEmail: 'client@testcompany.com',
            passwordHash,
            contactPerson: 'Marie Martin',
            contactPhone: '0123456789',
            isActive: true,
            emailVerified: true,
          })
          .returning();
        
        console.log('✅ Client créé:');
        console.log('   📧 Email:', newClient.contactEmail);
        console.log('   🏢 Société:', newClient.companyName);
        console.log('   👤 Contact:', newClient.contactPerson);
        console.log('   🔑 Mot de passe:', password);
      }
    } catch (error) {
      console.error('❌ Erreur création client:', error.message);
    }
    
    console.log('\n🎉 Utilisateurs test créés avec succès !');
    console.log('\n📋 RÉSUMÉ DES COMPTES DE TEST:');
    console.log('   👨‍💼 EMPLOYÉ:');
    console.log('      Email: test@example.com');
    console.log('      Password: test123456');
    console.log('   🏢 CLIENT:');
    console.log('      Email: client@testcompany.com');
    console.log('      Password: test123456');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestUser().catch(console.error);