# Guide Neon Database pour MedEclipse - Débutants

## 🌟 Qu'est-ce que Neon ?

**Neon** est une base de données PostgreSQL serverless moderne qui s'adapte automatiquement à vos besoins. Pour vous qui débutez, voici pourquoi c'est parfait :

✅ **Facile à configurer** - Pas de serveur à gérer
✅ **Mise à l'échelle automatique** - S'adapte à votre trafic
✅ **Gratuit pour commencer** - Plan gratuit généreux
✅ **Compatible PostgreSQL** - Toutes les fonctionnalités SQL
✅ **Branching** - Créer des environnements de test facilement

## 🚀 Étape 1: Configuration de Neon

### 1.1 Créer un Compte Neon
1. Allez sur [https://console.neon.tech/](https://console.neon.tech/)
2. Cliquez sur "Sign up"
3. Connectez-vous avec GitHub (recommandé)

### 1.2 Créer un Projet
1. Cliquez sur "Create Project"
2. Nom : `medeclipse-hr`
3. Région : `Europe (Frankfurt)` (plus proche de la France)
4. PostgreSQL Version : `16` (dernière version stable)

### 1.3 Récupérer la Connection String
```env
# Vous verrez quelque chose comme ça :
DATABASE_URL="postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/medeclipse?sslmode=require"
```

## 📦 Étape 2: Installation des Dépendances

Ajoutez ces packages à votre projet :

```bash
npm install @neondatabase/serverless drizzle-orm drizzle-kit zod
npm install -D @types/node
```

### 2.1 Mise à jour package.json
```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

## 🔧 Étape 3: Configuration du Projet

### 3.1 Variables d'Environnement
Créez `.env.local` :
```env
# Base de données Neon
DATABASE_URL="votre_connection_string_neon_ici"

# Next.js
NEXTAUTH_SECRET="votre_secret_jwt_ici"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.2 Configuration Drizzle
Créez `drizzle.config.ts` à la racine :
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
```

## 🗃️ Étape 4: Comprendre la Structure de Données

### 4.1 Notre Schéma Simple
```
Départements → Postes → Employés → Contrats
                     ↓
                   Congés
```

### 4.2 Tables Principales
1. **departments** - Services de l'hôpital (Cardiologie, Urgences, etc.)
2. **positions** - Postes (Médecin, Infirmier, etc.)
3. **employees** - Employés avec toutes leurs infos
4. **contracts** - Contrats de travail
5. **leaves** - Demandes de congés

## 🎯 Étape 5: Premiers Pas avec la Base de Données

### 5.1 Pousser le Schéma vers Neon
```bash
npm run db:push
```
Cette commande va :
- Se connecter à votre base Neon
- Créer toutes les tables
- Configurer les relations

### 5.2 Visualiser vos Données (Drizzle Studio)
```bash
npm run db:studio
```
Ouvre une interface web sur `http://localhost:4983` pour voir vos tables

### 5.3 Ajouter des Données de Test
Créez `scripts/seed.ts` :
```typescript
import { db } from '@/lib/db/neon'
import { departments, positions, employees } from '@/lib/db/schema'

async function seed() {
  // Créer un département
  const [medicalDept] = await db.insert(departments).values({
    code: 'MED',
    name: 'Médecine Générale',
    description: 'Service de médecine générale'
  }).returning()

  // Créer un poste
  const [doctorPosition] = await db.insert(positions).values({
    title: 'Médecin Généraliste',
    code: 'MG001',
    departmentId: medicalDept.id,
    isManager: false,
    isMedical: true
  }).returning()

  // Créer un employé
  await db.insert(employees).values({
    employeeNumber: 'MED20240001',
    firstName: 'Dr. Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@medeclipse.com',
    phone: '0123456789',
    hireDate: new Date(),
    departmentId: medicalDept.id,
    positionId: doctorPosition.id,
    status: 'active'
  })

  console.log('✅ Données de test ajoutées!')
}

seed().catch(console.error)
```

Puis ajoutez dans `package.json` :
```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## 📋 Étape 6: Utiliser les Server Actions (Exemples Simples)

### 6.1 Créer un Employé (Action)
```typescript
// actions/hr/employees/create-employee.ts
'use server'

import { db } from '@/lib/db/neon'
import { employees } from '@/lib/db/schema'

export async function createEmployee(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string

  try {
    const [newEmployee] = await db.insert(employees).values({
      employeeNumber: `EMP${Date.now()}`,
      firstName,
      lastName,
      email,
      status: 'active',
      hireDate: new Date(),
    }).returning()

    return { success: true, employee: newEmployee }
  } catch (error) {
    return { success: false, error: 'Erreur création employé' }
  }
}
```

### 6.2 Lister les Employés (Action)
```typescript
// actions/hr/employees/get-employees.ts
'use server'

import { db } from '@/lib/db/neon'
import { employees, departments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getEmployees() {
  return await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      status: employees.status,
      department: departments.name
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
}
```

### 6.3 Formulaire Client Component
```tsx
// components/forms/employee-form.tsx
'use client'

import { createEmployee } from '@/actions/hr/employees/create-employee'

export function EmployeeForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createEmployee(formData)
    
    if (result.success) {
      alert('Employé créé avec succès!')
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input 
        name="firstName" 
        placeholder="Prénom" 
        required 
        className="border p-2 rounded"
      />
      <input 
        name="lastName" 
        placeholder="Nom" 
        required 
        className="border p-2 rounded"
      />
      <input 
        name="email" 
        type="email" 
        placeholder="Email" 
        required 
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Créer Employé
      </button>
    </form>
  )
}
```

### 6.4 Page Server Component
```tsx
// app/(dashboard)/hr/employees/page.tsx
import { getEmployees } from '@/actions/hr/employees/get-employees'

export default async function EmployeesPage() {
  const employees = await getEmployees()

  return (
    <div>
      <h1>Liste des Employés</h1>
      <div className="grid gap-4 mt-4">
        {employees.map((employee) => (
          <div key={employee.id} className="border p-4 rounded">
            <h3>{employee.firstName} {employee.lastName}</h3>
            <p>Email: {employee.email}</p>
            <p>Statut: {employee.status}</p>
            <p>Département: {employee.department}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔄 Étape 7: Workflow de Développement

### 7.1 Modifier le Schéma
1. Modifiez `src/lib/db/schema.ts`
2. Lancez `npm run db:push` pour appliquer les changements

### 7.2 Environnements (Branches Neon)
- **Production** : branche `main` 
- **Développement** : branche `dev` (créée automatiquement)
- **Tests** : créez une branche `test`

### 7.3 Commandes Utiles
```bash
# Voir vos données
npm run db:studio

# Appliquer le schéma
npm run db:push

# Ajouter des données de test
npm run db:seed

# Démarrer le dev
npm run dev
```

## 🚨 Erreurs Communes et Solutions

### Erreur: "Connection String Invalid"
```bash
# Vérifiez votre .env.local
DATABASE_URL="postgresql://..."
```

### Erreur: "Table doesn't exist"
```bash
# Poussez votre schéma vers Neon
npm run db:push
```

### Erreur: "Cannot find module '@/lib/db/neon'"
```bash
# Vérifiez votre tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📚 Ressources pour Approfondir

1. **Documentation Neon** : https://neon.tech/docs
2. **Drizzle ORM** : https://orm.drizzle.team/
3. **Next.js Server Actions** : https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

## 🎉 Récapitulatif

Vous avez maintenant :
✅ Une base de données Neon configurée
✅ Un schéma Drizzle type-safe
✅ Des Server Actions pour les opérations CRUD
✅ Un workflow de développement simple

**Prochaines étapes :**
1. Testez la création d'employés
2. Ajoutez la validation avec Zod
3. Créez les autres fonctionnalités (contrats, congés)
4. Déployez sur Vercel

Vous êtes prêt à développer votre application RH ! 🚀