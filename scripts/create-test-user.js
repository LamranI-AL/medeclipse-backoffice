const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Création d\'un utilisateur test...');
    
    // 1. Créer un département test s'il n'existe pas
    const deptResult = await client.query(`
      INSERT INTO departments (id, name, description, created_at, updated_at)
      VALUES (gen_random_uuid(), 'IT Test', 'Département IT pour les tests', now(), now())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `);
    
    const departmentId = deptResult.rows[0].id;
    console.log('✅ Département créé/trouvé:', deptResult.rows[0].name);
    
    // 2. Hacher le mot de passe
    const password = 'test123456';
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 3. Créer l'employé test
    const employeeResult = await client.query(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, password_hash,
        role, department_id, is_active, email_verified, hire_date,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), 'TEST001', 'John', 'Doe', 'test@example.com', $1,
        'employee', $2, true, true, now(),
        now(), now()
      )
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = now()
      RETURNING id, email, first_name, last_name, role
    `, [passwordHash, departmentId]);
    
    const user = employeeResult.rows[0];
    console.log('✅ Utilisateur créé/mis à jour:');
    console.log('   📧 Email:', user.email);
    console.log('   👤 Nom:', user.first_name, user.last_name);
    console.log('   🔑 Mot de passe:', password);
    console.log('   🎭 Rôle:', user.role);
    
    // 4. Créer un client test aussi
    const clientResult = await client.query(`
      INSERT INTO clients (
        id, company_name, contact_email, password_hash, contact_person,
        contact_phone, is_active, email_verified, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), 'Test Company SARL', 'client@testcompany.com', $1,
        'Marie Martin', '0123456789', true, true, now(), now()
      )
      ON CONFLICT (contact_email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = now()
      RETURNING id, contact_email, company_name, contact_person
    `, [passwordHash]);
    
    const client_user = clientResult.rows[0];
    console.log('✅ Client créé/mis à jour:');
    console.log('   📧 Email:', client_user.contact_email);
    console.log('   🏢 Société:', client_user.company_name);
    console.log('   👤 Contact:', client_user.contact_person);
    console.log('   🔑 Mot de passe:', password);
    
    console.log('\n🎉 Utilisateurs test créés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Charger les variables d'environnement
require('dotenv').config();

createTestUser().catch(console.error);