# 🔐 Système d'Authentification MedEclipse

## 📋 Vue d'ensemble

Le système d'authentification de MedEclipse utilise **Better Auth** pour gérer l'authentification multi-rôles avec support des employés et clients, workspaces projets, et système de permissions granulaire.

## 🚀 Installation et Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de la base de données

Pousser le nouveau schéma vers Neon :

```bash
npm run db:push
```

### 3. Initialisation du système d'authentification

```bash
npm run auth:init
```

Cette commande va :
- Pousser le schéma vers Neon
- Créer le département système
- Créer le poste d'administrateur
- Créer le super admin initial
- Initialiser les permissions

### 4. Lancer l'application

```bash
npm run dev
```

## 🔑 Compte Administrateur Initial

**Email :** `admin@medeclipse.com`  
**Mot de passe :** `Admin123!`

⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

## 👥 Rôles et Permissions

### Hiérarchie des Rôles

1. **Super Admin** - Accès total au système
2. **Admin** - Gestion de l'organisation  
3. **Department Manager** - Gestion du département
4. **Employee** - Accès limité au département
5. **Client** - Accès aux projets assignés

### Permissions par Rôle

#### Super Admin
- ✅ Tous les droits sur le système
- ✅ Gestion des utilisateurs
- ✅ Configuration système
- ✅ Gestion des rôles

#### Admin
- ✅ Création/gestion utilisateurs
- ✅ Gestion départements
- ✅ Création/gestion projets
- ✅ Accès rapports

#### Department Manager  
- ✅ Gestion employés de son département
- ✅ Projets assignés à son département
- ✅ Workspaces des projets départementaux

#### Employee
- ✅ Profil personnel
- ✅ Collègues du département
- ✅ Projets assignés
- ✅ Messages dans les workspaces

#### Client
- ✅ Projets dont il est propriétaire
- ✅ Workspaces des projets
- ✅ Communication avec l'équipe

## 🏢 Workspaces et Projets

### Concept
Chaque projet a un workspace dédié pour la collaboration équipe-client.

### Fonctionnalités
- 💬 **Chat temps réel** (WhatsApp-like)
- 🧵 **Fils de discussion** organisés
- 📎 **Partage de fichiers**
- 👥 **Gestion des membres**
- 🔔 **Notifications**

### Gestion des Membres
- **Admin :** Gestion complète du workspace
- **Member :** Participation active
- **Observer :** Lecture seule

## 🛠️ Utilisation des APIs

### Authentification

```typescript
// Connexion
import { login } from '@/actions/auth/login'

const result = await login(formData)
if (result.success) {
  // Redirection automatique selon le rôle
}
```

```typescript
// Vérification session
import { getCurrentUser } from '@/actions/auth/session'

const user = await getCurrentUser()
if (user) {
  console.log(`Connecté en tant que: ${user.role}`)
}
```

### Gestion des Permissions

```typescript
// Hook côté client
import { useAuth } from '@/lib/auth/client'

const { user, hasPermission, canAccessDepartment } = useAuth()

if (hasPermission('departments', 'update', 'own')) {
  // Peut modifier son département
}
```

```typescript
// Server actions
import { requireRole } from '@/actions/auth/session'

export async function adminAction() {
  await requireRole(['super_admin', 'admin'])
  // Action réservée aux admins
}
```

### Projets

```typescript
// Création d'un projet
import { createProject } from '@/actions/projects/create-project'

const result = await createProject(formData)
// Crée automatiquement un workspace
```

### Workspaces

```typescript
// Messages workspace
import { sendMessage } from '@/actions/workspaces/messages'

const result = await sendMessage(workspaceId, formData)
```

## 🔒 Sécurité

### Middleware de Protection
Routes automatiquement protégées selon les rôles :

- `/dashboard/admin` → Super Admin, Admin
- `/dashboard/manager` → Department Manager
- `/dashboard/employee` → Employee  
- `/dashboard/client` → Client

### Validation des Données
Toutes les actions utilisent Zod pour la validation :

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

### Hashage des Mots de Passe
Utilise bcrypt avec salt de 12 rounds.

## 📊 Base de Données

### Nouvelles Tables
- `clients` - Clients de l'organisation
- `projects` - Projets client-équipe
- `workspaces` - Espaces de collaboration
- `workspace_members` - Membres des workspaces
- `messages` - Messages et threads
- `permissions` - Permissions système
- `role_permissions` - Attribution rôle-permission
- `sessions` - Sessions Better Auth

### Extensions Table Employees
- `password_hash` - Mot de passe hashé
- `role` - Rôle utilisateur
- `is_active` - Statut actif
- `last_login` - Dernière connexion
- `email_verified` - Email vérifié

## 🚨 Commandes Utiles

```bash
# Pousser schéma vers Neon
npm run db:push

# Studio Drizzle
npm run db:studio

# Réinitialiser admin
npm run db:init-admin

# Authentification complète  
npm run auth:init

# Développement
npm run dev
```

## 📝 Guide de Développement

### Créer une Nouvelle Action Protégée

```typescript
'use server'

import { requireRole } from '@/actions/auth/session'

export async function myAction() {
  const user = await requireRole(['admin'])
  // Votre logique ici
}
```

### Créer un Composant Protégé

```typescript
import { useAuth } from '@/lib/auth/client'

export function MyComponent() {
  const { user, hasRole } = useAuth()
  
  if (!hasRole(['admin', 'dept_manager'])) {
    return <div>Accès non autorisé</div>
  }
  
  return <div>Contenu protégé</div>
}
```

### Ajouter une Nouvelle Permission

1. Ajouter dans `/src/lib/permissions/index.ts`
2. Associer au rôle approprié
3. Utiliser dans les actions/composants

## 🐛 Dépannage

### Erreur "User not found"
- Vérifiez que l'admin initial a été créé : `npm run db:init-admin`

### Erreur de permissions
- Vérifiez les rôles dans la base de données
- Réinitialisez les permissions si nécessaire

### Session expirée
- Sessions valides 7 jours par défaut
- Configuration dans `/src/lib/auth/config.ts`

## 🔄 Roadmap

- [ ] Authentification 2FA
- [ ] OAuth (Google, Microsoft)
- [ ] Audit logs détaillés
- [ ] Notifications push
- [ ] Chat temps réel avec Socket.IO
- [ ] Gestion avancée des fichiers

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce README
2. Consultez la documentation Better Auth
3. Vérifiez les logs console/serveur

---

🎉 **Le système d'authentification MedEclipse est maintenant prêt !**