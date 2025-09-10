# Architecture d'Authentification et Gestion des Rôles - MedEclipse

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Système d'Authentification](#système-dauthentification)
3. [Gestion des Rôles et Permissions](#gestion-des-rôles-et-permissions)
4. [Workspaces Projets](#workspaces-projets)
5. [Modifications de la Base de Données](#modifications-de-la-base-de-données)
6. [Sécurité et Accès](#sécurité-et-accès)
7. [Implémentation Technique](#implémentation-technique)
8. [Guide de Migration](#guide-de-migration)

## 🎯 Vue d'ensemble

L'application MedEclipse implémente un système d'authentification multi-rôles avec gestion de workspaces pour permettre la collaboration entre équipes médicales et clients sur des projets spécifiques.

### Objectifs principaux :
- **Authentification sécurisée** avec mots de passe pour les employés
- **Gestion des rôles** hiérarchique (Admin, Manager, Employee, Client)
- **Workspaces projets** pour collaboration équipe-client
- **Accès limité** selon le département et les projets assignés
- **Communication** intégrée (chat, discussions par fils)

## 🔐 Système d'Authentification

### Technologie : Better Auth
Better Auth sera utilisé pour sa flexibilité, sa sécurité et son support des rôles avancés.

### Types d'utilisateurs :
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',    // Accès total
  ADMIN = 'admin',                // Gestion organisation
  DEPARTMENT_MANAGER = 'dept_manager', // Gestion département
  EMPLOYEE = 'employee',          // Accès limité département
  CLIENT = 'client'               // Accès projets assignés
}
```

### Flux d'authentification :
1. **Connexion** avec email/password
2. **Vérification** des credentials
3. **Génération** du token JWT avec rôles
4. **Redirection** selon le rôle et les permissions

## 👥 Gestion des Rôles et Permissions

### Hiérarchie des Rôles

#### 1. Super Admin
```typescript
permissions: [
  'users:create', 'users:read', 'users:update', 'users:delete',
  'departments:*', 'projects:*', 'workspaces:*',
  'system:configure', 'roles:manage'
]
```

#### 2. Admin
```typescript
permissions: [
  'users:create', 'users:read', 'users:update',
  'departments:*', 'projects:create', 'projects:manage',
  'workspaces:create', 'reports:view'
]
```

#### 3. Department Manager
```typescript
permissions: [
  'users:read', 'users:update:own_department',
  'departments:read:own', 'departments:update:own',
  'projects:read:assigned', 'projects:update:assigned',
  'workspaces:access:assigned', 'team:manage:own_department'
]
```

#### 4. Employee
```typescript
permissions: [
  'users:read:own', 'users:update:own',
  'departments:read:own', 'projects:read:assigned',
  'workspaces:access:assigned', 'team:view:own_department',
  'messages:send', 'messages:read:assigned'
]
```

#### 5. Client
```typescript
permissions: [
  'users:read:own', 'users:update:own',
  'projects:read:assigned', 'workspaces:access:assigned',
  'messages:send:assigned', 'messages:read:assigned'
]
```

### Système de Permissions Granulaires

```typescript
interface Permission {
  resource: string      // 'users', 'projects', 'departments'
  action: string       // 'create', 'read', 'update', 'delete'
  scope?: string       // 'own', 'department', 'assigned', 'all'
  conditions?: object  // Conditions additionnelles
}
```

## 🏢 Workspaces Projets

### Concept
Chaque projet dispose d'un workspace dédié où équipe médicale et client collaborent.

### Fonctionnalités des Workspaces :
- **Messages en temps réel** (comme WhatsApp)
- **Fils de discussion** organisés par sujet
- **Partage de fichiers** médical sécurisé
- **Gestion des tâches** et jalons
- **Notifications** intelligentes

### Structure d'un Workspace :
```typescript
interface Workspace {
  id: string
  projectId: string
  name: string
  description?: string
  
  // Membres
  members: WorkspaceMember[]
  
  // Communication
  channels: Channel[]
  messages: Message[]
  threads: Thread[]
  
  // Paramètres
  settings: WorkspaceSettings
  createdAt: Date
  updatedAt: Date
}

interface WorkspaceMember {
  userId: string
  workspaceId: string
  role: 'admin' | 'member' | 'observer'
  joinedAt: Date
  permissions: string[]
}
```

## 🗄️ Modifications de la Base de Données

### Nouvelles Tables Requises

#### 1. Table `users` (Extension de employees)
```sql
ALTER TABLE employees ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE employees ADD COLUMN role VARCHAR(50) DEFAULT 'employee';
ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN last_login TIMESTAMP;
ALTER TABLE employees ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN created_by VARCHAR(255);
ALTER TABLE employees ADD COLUMN updated_by VARCHAR(255);

-- Index pour performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role ON employees(role);
```

#### 2. Table `clients`
```sql
CREATE TABLE clients (
  id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) UNIQUE NOT NULL,
  contact_phone VARCHAR(20),
  address TEXT,
  contact_person VARCHAR(255),
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);
```

#### 3. Table `projects`
```sql
CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id VARCHAR(255) REFERENCES clients(id),
  department_id VARCHAR(255) REFERENCES departments(id),
  manager_id VARCHAR(255) REFERENCES employees(id),
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. Table `workspaces`
```sql
CREATE TABLE workspaces (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5. Table `workspace_members`
```sql
CREATE TABLE workspace_members (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) REFERENCES workspaces(id),
  user_id VARCHAR(255), -- Peut être employee_id ou client_id
  user_type VARCHAR(20), -- 'employee' ou 'client'
  role VARCHAR(50) DEFAULT 'member',
  permissions JSONB,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Table `messages`
```sql
CREATE TABLE messages (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) REFERENCES workspaces(id),
  sender_id VARCHAR(255) NOT NULL,
  sender_type VARCHAR(20) NOT NULL, -- 'employee' ou 'client'
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'image'
  thread_id VARCHAR(255), -- Pour les réponses
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 7. Table `permissions`
```sql
CREATE TABLE permissions (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(50),
  description TEXT
);
```

#### 8. Table `role_permissions`
```sql
CREATE TABLE role_permissions (
  role VARCHAR(50),
  permission_id VARCHAR(255) REFERENCES permissions(id),
  PRIMARY KEY (role, permission_id)
);
```

## 🔒 Sécurité et Accès

### Middleware d'Authentification
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return NextResponse.redirect('/login')
  }
  
  const user = await verifyToken(token)
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  // Vérification des permissions par route
  const hasPermission = await checkPermission(
    user.role, 
    request.nextUrl.pathname
  )
  
  if (!hasPermission) {
    return NextResponse.redirect('/unauthorized')
  }
  
  return NextResponse.next()
}
```

### Contrôle d'Accès par Département
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const { user } = useSession()
  
  const canAccessDepartment = (departmentId: string) => {
    if (user.role === 'super_admin' || user.role === 'admin') return true
    if (user.role === 'dept_manager' && user.departmentId === departmentId) return true
    if (user.role === 'employee' && user.departmentId === departmentId) return true
    return false
  }
  
  const canAccessProject = (projectId: string) => {
    return user.assignedProjects?.includes(projectId) || false
  }
  
  return { user, canAccessDepartment, canAccessProject }
}
```

## 💻 Implémentation Technique

### 1. Configuration Better Auth
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg"
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "employee"
      },
      departmentId: {
        type: "string"
      }
    }
  },
  plugins: [
    // Plugin pour gestion des rôles
    {
      id: "roles",
      init: (ctx) => {
        return {
          middleware: [
            {
              path: "/api/**",
              middleware: roleMiddleware
            }
          ]
        }
      }
    }
  ]
})
```

### 2. Server Actions Sécurisées
```typescript
// actions/auth/check-permission.ts
'use server'

export async function checkPermission(
  resource: string,
  action: string,
  scope?: string
) {
  const user = await getCurrentUser()
  if (!user) return false
  
  return await hasPermission(user.id, resource, action, scope)
}

// Exemple d'utilisation dans une action
export async function getDepartmentEmployees(departmentId: string) {
  const hasAccess = await checkPermission('departments', 'read', departmentId)
  if (!hasAccess) {
    throw new Error('Accès non autorisé')
  }
  
  return await db.select()
    .from(employees)
    .where(eq(employees.departmentId, departmentId))
}
```

### 3. Composants de Protection
```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback
}: ProtectedRouteProps) {
  const { user, hasPermission } = useAuth()
  
  if (!user) {
    return <LoginRedirect />
  }
  
  if (requiredRole && !requiredRole.includes(user.role)) {
    return fallback || <UnauthorizedPage />
  }
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <UnauthorizedPage />
  }
  
  return <>{children}</>
}
```

## 📋 Guide de Migration

### Étape 1: Installation des Dépendances
```bash
npm install better-auth @better-auth/drizzle
npm install @types/bcryptjs bcryptjs
npm install socket.io-client # Pour le chat en temps réel
```

### Étape 2: Commandes Neon Database
```bash
# Se connecter à Neon
npx drizzle-kit studio

# Appliquer les migrations
npx drizzle-kit push
```

### Étape 3: Scripts de Migration
```sql
-- Script 1: Ajout des colonnes d'authentification
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';

-- Script 2: Création des nouvelles tables
-- (Utiliser les scripts SQL fournis ci-dessus)

-- Script 3: Données initiales
INSERT INTO permissions (id, name, resource, action, scope) VALUES
('perm_1', 'Read Own Department', 'departments', 'read', 'own'),
('perm_2', 'Manage Own Department', 'departments', 'update', 'own'),
('perm_3', 'Access Assigned Projects', 'projects', 'read', 'assigned');

-- Script 4: Attribution des permissions par rôle
INSERT INTO role_permissions (role, permission_id) VALUES
('employee', 'perm_1'),
('dept_manager', 'perm_1'),
('dept_manager', 'perm_2'),
('admin', 'perm_3');
```

### Étape 4: Configuration des Variables d'Environnement
```bash
# .env.local
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3003"
DATABASE_URL="your-neon-connection-string"

# Configuration Socket.IO pour le chat
SOCKET_SERVER_URL="http://localhost:3004"
```

### Étape 5: Première Connexion Admin
```typescript
// scripts/create-admin.ts
import bcrypt from 'bcryptjs'

async function createAdmin() {
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10)
  
  await db.insert(employees).values({
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'System',
    email: 'admin@medeclipse.com',
    password_hash: passwordHash,
    role: 'super_admin',
    departmentId: null // Admin global
  })
}
```

## 🚀 Exemple d'Interface Utilisateur

### Dashboard selon le Rôle
```typescript
// pages/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  switch(user.role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />
    
    case 'dept_manager':
      return <ManagerDashboard departmentId={user.departmentId} />
    
    case 'employee':
      return <EmployeeDashboard 
        departmentId={user.departmentId}
        assignedProjects={user.assignedProjects}
      />
    
    case 'client':
      return <ClientDashboard 
        assignedProjects={user.assignedProjects}
      />
    
    default:
      return <UnauthorizedPage />
  }
}
```

### Vue Département pour Employés
```typescript
// components/dashboard/EmployeeDashboard.tsx
export function EmployeeDashboard({ departmentId, assignedProjects }) {
  return (
    <div className="space-y-6">
      {/* Collègues du département */}
      <DepartmentTeam departmentId={departmentId} />
      
      {/* Projets assignés */}
      <AssignedProjects projects={assignedProjects} />
      
      {/* Workspaces accessibles */}
      <AccessibleWorkspaces userId={user.id} />
    </div>
  )
}
```

## 📞 Chat et Communication

### Système de Messages en Temps Réel
```typescript
// components/workspace/Chat.tsx
export function WorkspaceChat({ workspaceId }) {
  const { messages, sendMessage } = useChat(workspaceId)
  const { user } = useAuth()
  
  return (
    <div className="chat-container">
      <MessagesList messages={messages} currentUser={user} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

Cette architecture garantit une sécurité robuste, une gestion granulaire des permissions et une expérience utilisateur adaptée à chaque rôle dans l'organisation médicale.