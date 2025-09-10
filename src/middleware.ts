import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/public'
]

// Routes protégées qui nécessitent une authentification
const protectedRoutes = [
  '/dashboard',
  '/employees',
  '/departments',
  '/positions', 
  '/projects',
  '/workspaces',
  '/clients',
  '/profile',
  '/settings'
]

// Routes spécifiques par rôle
const roleBasedRoutes = {
  '/dashboard/admin': ['super_admin', 'admin'],
  '/dashboard/manager': ['dept_manager'],
  '/dashboard/employee': ['employee'],
  '/dashboard/client': ['client'],
  '/system': ['super_admin'],
  '/clients': ['super_admin', 'admin'],
  '/employees/new': ['super_admin', 'admin'],
  '/departments/new': ['super_admin', 'admin'],
  '/positions/new': ['super_admin', 'admin']
}

// Dashboard par défaut selon le rôle
const defaultDashboardByRole = {
  super_admin: '/dashboard/admin',
  admin: '/dashboard/admin',
  dept_manager: '/dashboard/manager',
  employee: '/dashboard/employee',
  client: '/dashboard/client'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignorer les fichiers statiques et API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    // Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers
    })

    const isAuthenticated = !!session?.user
    const user = session?.user

    // Si l'utilisateur n'est pas authentifié
    if (!isAuthenticated) {
      // Permettre l'accès aux routes publiques
      if (isPublicRoute(pathname)) {
        return NextResponse.next()
      }
      
      // Rediriger vers login pour les routes protégées
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // L'utilisateur est authentifié
    
    // Vérifier si le compte est actif
    if (!user?.isActive) {
      const response = NextResponse.redirect(new URL('/login?error=account-disabled', request.url))
      // Supprimer la session
      response.cookies.delete('better-auth.session_token')
      return response
    }

    // Si l'utilisateur essaie d'accéder aux pages publiques (login, register)
    if (isPublicRoute(pathname) && pathname !== '/') {
      const dashboardUrl = getDashboardForUser(user)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Vérifier l'accès aux routes spécifiques par rôle
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(user.role)) {
          // Rediriger vers le dashboard approprié
          const dashboardUrl = getDashboardForUser(user)
          return NextResponse.redirect(new URL(dashboardUrl, request.url))
        }
      }
    }

    // Si l'utilisateur accède à /dashboard sans spécifier le type
    if (pathname === '/dashboard') {
      const dashboardUrl = getDashboardForUser(user)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Vérifications spéciales pour les employés
    if (user.userType === 'employee') {
      // Les employés ne peuvent pas accéder aux routes clients
      if (pathname.startsWith('/dashboard/client')) {
        return NextResponse.redirect(new URL(getDashboardForUser(user), request.url))
      }
    }

    // Vérifications spéciales pour les clients
    if (user.userType === 'client') {
      // Les clients ne peuvent accéder qu'à leur dashboard et projets assignés
      const allowedClientRoutes = [
        '/dashboard/client',
        '/projects',
        '/workspaces',
        '/profile'
      ]
      
      const hasAccess = allowedClientRoutes.some(route => pathname.startsWith(route))
      
      if (!hasAccess && !isPublicRoute(pathname)) {
        return NextResponse.redirect(new URL('/dashboard/client', request.url))
      }
    }

    // Ajouter les informations utilisateur aux headers pour les pages
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)
    requestHeaders.set('x-user-type', user.userType)
    
    if (user.departmentId) {
      requestHeaders.set('x-user-department', user.departmentId)
    }

    // Permettre l'accès à la route
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })

  } catch (error) {
    console.error('Middleware auth error:', error)
    
    // En cas d'erreur, rediriger vers login
    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL('/login?error=session-error', request.url))
    }
    
    return NextResponse.next()
  }
}

// Vérifier si une route est publique
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname.startsWith(route)
  })
}

// Obtenir le dashboard approprié pour un utilisateur
function getDashboardForUser(user: any): string {
  return defaultDashboardByRole[user.role as keyof typeof defaultDashboardByRole] || '/dashboard'
}

// Configuration du matcher pour optimiser les performances
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}