# MedEclipse - Application RH Haute Performance

Application de gestion des ressources humaines pour environnement médical, construite avec Next.js 15, Server Actions, Neon Database et une architecture clean moderne.

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances
```bash
npm install
```

### 2. Configuration de la Base de Données Neon

1. **Créer un compte Neon**: https://console.neon.tech/
2. **Créer un projet**: `medeclipse-hr`
3. **Copier la connection string** 

### 3. Configuration des Variables d'Environnement
```bash
cp .env.example .env.local
```

Puis modifiez `.env.local` avec vos valeurs :
```env
DATABASE_URL="your_neon_connection_string_here"
NEXTAUTH_SECRET="your_secret_key_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup de la Base de Données
```bash
# Appliquer le schéma à Neon
npm run db:push

# Ajouter des données de test
npm run db:seed
```

### 5. Lancement de l'Application
```bash
npm run dev
```

L'application sera disponible sur http://localhost:3000

## 📁 Structure du Projet

```
src/
├── actions/           # 🔥 Server Actions (cœur de l'app)
│   ├── auth/          # Actions d'authentification
│   ├── hr/            # Actions RH
│   │   ├── employees/ # Gestion des employés
│   │   ├── contracts/ # Gestion des contrats
│   │   └── leaves/    # Gestion des congés
│   └── shared/        # Actions communes
├── app/               # App Router Next.js 15
│   ├── (auth)/        # Pages d'authentification
│   ├── (dashboard)/   # Pages du tableau de bord
│   └── api/           # API Routes (pour APIs externes)
├── lib/               # Configuration et utilitaires
│   ├── db/            # Configuration Neon + Drizzle
│   └── validations/   # Schémas Zod
└── components/        # Composants UI (shadcn/ui)
```

## 🗄️ Base de Données

### Schéma Principal
- **departments** - Départements de l'hôpital
- **positions** - Postes et fonctions
- **employees** - Employés avec toutes leurs informations
- **contracts** - Contrats de travail
- **leaves** - Demandes de congés

### Commandes Utiles
```bash
npm run db:studio    # Interface web pour voir les données
npm run db:push      # Appliquer le schéma à Neon
npm run db:seed      # Ajouter des données de test
```

## 🎯 APIs Disponibles

### Employés
- `GET /api/v1/hr/employees` - Liste des employés
- `POST /api/v1/hr/employees` - Créer un employé
- `GET /api/v1/hr/employees/[id]` - Détails d'un employé
- `PUT /api/v1/hr/employees/[id]` - Modifier un employé
- `DELETE /api/v1/hr/employees/[id]` - Supprimer un employé

### Départements
- `GET /api/v1/hr/departments` - Liste des départements
- `POST /api/v1/hr/departments` - Créer un département

### Postes
- `GET /api/v1/hr/positions` - Liste des postes
- `POST /api/v1/hr/positions` - Créer un poste

## 🔧 Server Actions

### Exemple d'Utilisation

#### 1. Dans un Server Component
```tsx
// app/(dashboard)/hr/employees/page.tsx
import { getEmployeesList } from '@/actions/hr/employees/get-employees'

export default async function EmployeesPage() {
  const { data: employees } = await getEmployeesList()
  
  return (
    <div>
      {employees.map(employee => (
        <div key={employee.id}>
          {employee.firstName} {employee.lastName}
        </div>
      ))}
    </div>
  )
}
```

#### 2. Dans un Client Component
```tsx
// components/forms/employee-form.tsx
'use client'

import { createEmployee } from '@/actions/hr/employees/create-employee'

export function EmployeeForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createEmployee(formData)
    if (result.success) {
      // Succès !
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Champs du formulaire */}
    </form>
  )
}
```

## 📚 Documentation Architecture

Consultez le dossier `architect/` pour la documentation complète :

- [Vue d'ensemble](./architect/01-project-overview.md)
- [Architecture Clean](./architect/02-clean-architecture.md) 
- [Performance Strategy](./architect/03-performance-strategy.md)
- [Service RH Design](./architect/04-hr-service-design.md)
- [Spécifications API](./architect/05-api-specifications.md)
- [Base de Données](./architect/06-database-design.md)

## 🔍 Guide Neon Database

Consultez [NEON-DATABASE-GUIDE.md](./NEON-DATABASE-GUIDE.md) pour un guide complet sur l'utilisation de Neon Database.

## 🚀 Prochaines Étapes

1. **Phase 1 Actuelle**: Service RH complet
2. **Phase 2**: Gestion des patients  
3. **Phase 3**: Facturation et assurances
4. **Phase 4**: Inventaire médical
5. **Phase 5**: Analytics et BI

## 💡 Technologies Utilisées

- **Framework**: Next.js 15.5.2 avec App Router
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM (type-safe)
- **Validation**: Zod
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Language**: TypeScript 5

## 📝 Scripts Disponibles

```bash
npm run dev          # Développement avec Turbopack
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript

# Base de données
npm run db:push      # Appliquer le schéma
npm run db:studio    # Interface graphique
npm run db:seed      # Données de test
npm run db:generate  # Générer les migrations
npm run db:migrate   # Appliquer les migrations
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changes (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**MedEclipse** - Application RH moderne pour le secteur médical 🏥