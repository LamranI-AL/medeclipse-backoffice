import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth/session'

export default async function HomePage() {
  // Vérifier si l'utilisateur est connecté
  const user = await getCurrentUser()
  
  if (user) {
    // Rediriger vers le dashboard approprié selon le rôle
    switch (user.role) {
      case 'super_admin':
      case 'admin':
        redirect('/dashboard/admin')
      case 'dept_manager':
        redirect('/dashboard/manager')
      case 'employee':
        redirect('/dashboard/employee')
      case 'client':
        redirect('/dashboard/client')
      default:
        redirect('/dashboard')
    }
  } else {
    // Rediriger vers la page de connexion
    redirect('/login')
  }
}