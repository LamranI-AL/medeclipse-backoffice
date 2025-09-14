'use client'

import { createAuthClient } from "better-auth/react"
import { AuthUser, UserRole, UserType } from "@/lib/db/schema"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient

// Hook personnalisé pour obtenir les informations d'authentification
export function useAuth() {
  const { data: session, isPending, error } = useSession()
  
  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.userType === 'employee' ? session.user.name?.split(' ')[0] : undefined,
    lastName: session.user.userType === 'employee' ? session.user.name?.split(' ').slice(1).join(' ') : undefined,
    companyName: session.user.userType === 'client' ? session.user.name : undefined,
    role: session.user.role as UserRole,
    userType: session.user.userType as UserType,
    departmentId: session.user.departmentId,
    isActive: session.user.isActive
  } : null
  
  // Fonction pour vérifier les permissions
  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }
  
  const hasPermission = (resource: string, action: string, scope?: string) => {
    if (!user) return false
    
    // Super admin a tous les droits
    if (user.role === 'super_admin') return true
    
    // Logique de base pour les permissions
    switch (user.role) {
      case 'admin':
        return ['users', 'departments', 'projects', 'workspaces'].includes(resource)
      
      case 'dept_manager':
        if (resource === 'departments' && scope === 'own') return true
        if (resource === 'employees' && scope === 'department') return true
        if (resource === 'projects' && ['read', 'update'].includes(action)) return true
        return false
      
      case 'employee':
        if (resource === 'employees' && scope === 'own') return true
        if (resource === 'departments' && action === 'read' && scope === 'own') return true
        if (resource === 'projects' && action === 'read') return true
        if (resource === 'messages' && ['read', 'send'].includes(action)) return true
        return false
      
      case 'client':
        if (resource === 'projects' && action === 'read') return true
        if (resource === 'messages' && ['read', 'send'].includes(action)) return true
        if (resource === 'workspaces' && action === 'read') return true
        return false
      
      default:
        return false
    }
  }
  
  const canAccessDepartment = (departmentId?: string) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'admin') return true
    if (user.userType === 'client') return false
    return user.departmentId === departmentId
  }
  
  const canManageDepartment = (departmentId?: string) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'admin') return true
    if (user.role === 'dept_manager' && user.departmentId === departmentId) return true
    return false
  }
  
  const isEmployee = user?.userType === 'employee'
  const isClient = user?.userType === 'client'
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isManager = user?.role === 'dept_manager'
  
  return {
    user,
    session,
    isPending,
    error,
    isAuthenticated: !!user,
    isEmployee,
    isClient,
    isAdmin,
    isManager,
    hasRole,
    hasPermission,
    canAccessDepartment,
    canManageDepartment,
    signIn,
    signOut
  }
}