// Test simple de l'authentification via l'API REST
const fetch = require('node-fetch');

async function testAuth() {
  const BASE_URL = 'http://localhost:3002';
  
  console.log('🧪 Test de lauthentification BetterAuth');
  console.log('=====================================');
  
  try {
    // 1. Test de connexion avec des identifiants test
    console.log('\n1. 🔐 Test de connexion...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@powerapp.com',  // Email par défaut
        password: 'admin123'          // Mot de passe par défaut
      })
    });
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Connexion réussie !');
      console.log('📄 Réponse:', loginResult);
      
      // Récupérer les cookies de session
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        console.log('🍪 Cookies de session:', cookies);
      }
    } else {
      console.log('❌ Échec de la connexion');
      console.log('📄 Statut:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('📄 Erreur:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
  
  console.log('\n🎯 Conseils pour créer des utilisateurs:');
  console.log('=====================================');
  console.log('1. Utilisez l\'interface d\'administration de Neon');
  console.log('2. Insérez manuellement des données test');
  console.log('3. Ou utilisez l\'API de création d\'utilisateur');
  
  console.log('\n📋 Structure des tables requises:');
  console.log('- employees (pour les employés)');
  console.log('- clients (pour les clients)');
  console.log('- departments (départements)');
  console.log('- sessions (sessions BetterAuth)');
}

testAuth().catch(console.error);