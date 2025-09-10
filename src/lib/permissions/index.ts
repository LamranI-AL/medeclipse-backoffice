import { db } from "@/lib/db/neon"
import { permissions, rolePermissions, employees, clients } from "@/lib/db/schema"
import { AuthUser, PermissionCheck, UserRole } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// Permissions prédéfinies
export const PERMISSIONS = {
  // Utilisateurs
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_READ_OWN: 'users:read:own',
  USERS_UPDATE_OWN: 'users:update:own',
  
  // Départements
  DEPARTMENTS_CREATE: 'departments:create',
  DEPARTMENTS_READ: 'departments:read',
  DEPARTMENTS_UPDATE: 'departments:update',
  DEPARTMENTS_DELETE: 'departments:delete',
  DEPARTMENTS_READ_OWN: 'departments:read:own',
  DEPARTMENTS_UPDATE_OWN: 'departments:update:own',
  
  // Projets
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_READ: 'projects:read',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_READ_ASSIGNED: 'projects:read:assigned',
  PROJECTS_UPDATE_ASSIGNED: 'projects:update:assigned',
  
  // Workspaces
  WORKSPACES_CREATE: 'workspaces:create',
  WORKSPACES_READ: 'workspaces:read',
  WORKSPACES_UPDATE: 'workspaces:update',
  WORKSPACES_DELETE: 'workspaces:delete',
  WORKSPACES_ACCESS_ASSIGNED: 'workspaces:access:assigned',
  
  // Messages
  MESSAGES_SEND: 'messages:send',
  MESSAGES_READ: 'messages:read',
  MESSAGES_UPDATE_OWN: 'messages:update:own',
  MESSAGES_DELETE_OWN: 'messages:delete:own',
  
  // Système
  SYSTEM_CONFIGURE: 'system:configure',
  ROLES_MANAGE: 'roles:manage',
  REPORTS_VIEW: 'reports:view',
} as const

// Permissions par rôle (cache en mémoire)
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.DEPARTMENTS_CREATE,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.DEPARTMENTS_UPDATE,
    PERMISSIONS.DEPARTMENTS_DELETE,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.WORKSPACES_CREATE,
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.WORKSPACES_UPDATE,
    PERMISSIONS.WORKSPACES_DELETE,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.SYSTEM_CONFIGURE,
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  admin: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.DEPARTMENTS_CREATE,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.DEPARTMENTS_UPDATE,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.WORKSPACES_CREATE,
    PERMISSIONS.WORKSPACES_READ,
    PERMISSIONS.WORKSPACES_UPDATE,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  dept_manager: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.DEPARTMENTS_READ_OWN,
    PERMISSIONS.DEPARTMENTS_UPDATE_OWN,
    PERMISSIONS.PROJECTS_READ_ASSIGNED,
    PERMISSIONS.PROJECTS_UPDATE_ASSIGNED,
    PERMISSIONS.WORKSPACES_ACCESS_ASSIGNED,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_READ,
  ],
  
  employee: [
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.DEPARTMENTS_READ_OWN,
    PERMISSIONS.PROJECTS_READ_ASSIGNED,
    PERMISSIONS.WORKSPACES_ACCESS_ASSIGNED,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_UPDATE_OWN,
    PERMISSIONS.MESSAGES_DELETE_OWN,
  ],
  
  client: [
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.PROJECTS_READ_ASSIGNED,
    PERMISSIONS.WORKSPACES_ACCESS_ASSIGNED,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_READ,
    PERMISSIONS.MESSAGES_UPDATE_OWN,
    PERMISSIONS.MESSAGES_DELETE_OWN,
  ],
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export async function hasPermission(
  user: AuthUser,
  permission: string,
  context?: {
    resourceId?: string
    departmentId?: string
    projectId?: string
    targetUserId?: string
  }
): Promise<boolean> {
  // Super admin a tous les droits
  if (user.role === 'super_admin') {
    return true
  }
  
  // Vérifier les permissions de base du rôle
  const rolePermissions = ROLE_PERMISSIONS[user.role]
  if (!rolePermissions.includes(permission)) {
    return false
  }
  
  // Vérifications contextuelles
  if (context) {
    // Permissions "own" - l'utilisateur ne peut agir que sur ses propres ressources
    if (permission.includes(':own')) {
      if (context.targetUserId && context.targetUserId !== user.id) {
        return false
      }
    }
    
    // Permissions departement - seulement pour son département
    if (permission.includes('departments:') && permission.includes(':own')) {
      if (user.userType !== 'employee' || !user.departmentId) {
        return false
      }
      if (context.departmentId && context.departmentId !== user.departmentId) {
        return false
      }
    }
    
    // Permissions projet - seulement pour les projets assignés
    if (permission.includes(':assigned') && context.projectId) {
      return await isUserAssignedToProject(user.id, context.projectId)
    }
  }
  
  return true
}

/**
 * Vérifie si un utilisateur peut accéder à un département
 */
export function canAccessDepartment(user: AuthUser, departmentId: string): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true
  }
  
  if (user.userType === 'client') {
    return false
  }
  
  return user.departmentId === departmentId
}

/**
 * Vérifie si un utilisateur peut gérer un département
 */
export function canManageDepartment(user: AuthUser, departmentId: string): boolean {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true
  }
  
  if (user.role === 'dept_manager' && user.departmentId === departmentId) {
    return true
  }
  
  return false
}

/**
 * Vérifie si un utilisateur est assigné à un projet
 */
export async function isUserAssignedToProject(userId: string, projectId: string): Promise<boolean> {
  try {
    // Pour l'instant, on considère qu'un employé est assigné si le projet appartient à son département
    // Ou si c'est le manager du projet
    // Pour les clients, on vérifie s'ils sont propriétaires du projet
    
    const user = await db
      .select({
        userType: employees.role,
        departmentId: employees.departmentId
      })
      .from(employees)
      .where(eq(employees.id, userId))
      .limit(1)
    
    if (user[0]) {
      // C'est un employé - vérifier le projet
      const project = await db.query.projects.findFirst({
        where: eq(db.select().from(db.schema.projects).where(eq(db.schema.projects.id, projectId)))
      })
      
      if (project?.departmentId === user[0].departmentId || project?.managerId === userId) {
        return true
      }
    } else {
      // Vérifier si c'est un client
      const clientProject = await db.query.projects.findFirst({
        where: and(
          eq(db.select().from(db.schema.projects).where(eq(db.schema.projects.id, projectId))),
          eq(db.select().from(db.schema.projects).where(eq(db.schema.projects.clientId, userId)))
        )
      })
      
      return !!clientProject
    }
    
    return false
  } catch (error) {
    console.error('Error checking project assignment:', error)
    return false
  }
}

/**
 * Décorateur pour vérifier les permissions dans les server actions
 */
export function requirePermission(permission: string, context?: any) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      // Récupérer l'utilisateur actuel (à implémenter selon votre système d'auth)
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Authentification requise')
      }
      
      const hasAccess = await hasPermission(user, permission, context)
      if (!hasAccess) {
        throw new Error('Permissions insuffisantes')
      }
      
      return method.apply(this, args)
    }
  }
}

/**
 * Utilitaire pour obtenir les permissions d'un rôle
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Initialiser les permissions en base de données
 */
export async function initializePermissions() {
  try {
    // Insérer les permissions de base
    const permissionsList = Object.values(PERMISSIONS).map(perm => {
      const [resource, action, scope] = perm.split(':')
      return {
        id: crypto.randomUUID(),
        name: perm,
        resource,
        action,
        scope,
        description: `Permission to ${action} ${resource}${scope ? ` (${scope})` : ''}`
      }
    })
    
    for (const permission of permissionsList) {
      await db.insert(permissions).values(permission).onConflictDoNothing()
    }
    
    // Associer les permissions aux rôles
    for (const [role, rolePerms] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permName of rolePerms) {
        const permissionRecord = await db
          .select()
          .from(permissions)
          .where(eq(permissions.name, permName))
          .limit(1)
        
        if (permissionRecord[0]) {
          await db
            .insert(rolePermissions)
            .values({
              role: role as UserRole,
              permissionId: permissionRecord[0].id
            })
            .onConflictDoNothing()
        }
      }
    }
    
    console.log('Permissions initialized successfully')
  } catch (error) {
    console.error('Error initializing permissions:', error)
  }
}