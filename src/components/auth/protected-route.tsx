'use client'

import { useAuth } from '@/lib/auth/client'
import { UserRole } from '@/lib/db/schema'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermission?: string
  fallback?: React.ReactNode
  requireDepartment?: boolean
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
  fallback,
  requireDepartment = false
}: ProtectedRouteProps) {
  const { user, isPending, isAuthenticated, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  // Chargement en cours
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Non authentifié
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Authentification requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vérification des rôles
  if (requiredRoles && !hasRole(requiredRoles)) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              <br />
              Rôle requis : {requiredRoles.join(', ')}
              <br />
              Votre rôle : {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Retour
            </Button>
            <Button 
              onClick={() => router.push(getDashboardForRole(user.role))}
              className="w-full"
            >
              Aller au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vérification des permissions
  if (requiredPermission && !hasPermission(requiredPermission, 'read')) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle>Permission insuffisante</CardTitle>
            <CardDescription>
              Vous n'avez pas la permission nécessaire : {requiredPermission}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Retour
            </Button>
            <Button 
              onClick={() => router.push(getDashboardForRole(user.role))}
              className="w-full"
            >
              Aller au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vérification du département (pour les employés)
  if (requireDepartment && user.userType === 'employee' && !user.departmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle>Département manquant</CardTitle>
            <CardDescription>
              Votre compte n'est assigné à aucun département. 
              Contactez votre administrateur pour résoudre ce problème.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/profile')}
              className="w-full"
            >
              Voir mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Compte inactif
  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Compte désactivé</CardTitle>
            <CardDescription>
              Votre compte a été désactivé. 
              Contactez votre administrateur pour plus d'informations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Toutes les vérifications passent, afficher le contenu
  return <>{children}</>
}

// Hook pour les pages qui nécessitent une authentification
export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { user, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    router.push(getDashboardForRole(user?.role || 'employee'))
    return null
  }

  return user
}

// Composant pour les sections administratives
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      {children}
    </ProtectedRoute>
  )
}

// Composant pour les employés seulement
export function EmployeeOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute 
      requiredRoles={['super_admin', 'admin', 'dept_manager', 'employee']}
      requireDepartment
    >
      {children}
    </ProtectedRoute>
  )
}

// Composant pour les clients seulement
export function ClientOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['client']}>
      {children}
    </ProtectedRoute>
  )
}

// Utilitaire pour obtenir le dashboard selon le rôle
function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/dashboard/admin'
    case 'dept_manager':
      return '/dashboard/manager'
    case 'employee':
      return '/dashboard/employee'
    case 'client':
      return '/dashboard/client'
    default:
      return '/dashboard'
  }
}