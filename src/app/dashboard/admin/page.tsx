import { AdminOnly } from '@/components/auth/protected-route'
import { getCurrentUser } from '@/actions/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Briefcase, MessageSquare } from 'lucide-react'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Erreur d'authentification</div>
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord Administrateur</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user.firstName} {user.lastName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">
                +12% depuis le mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Départements</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Tous opérationnels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                +3 nouveaux cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                Non lus aujourd'hui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Gérez votre organisation MedEclipse
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Gérer les employés</p>
                  <p className="text-sm text-muted-foreground">
                    Ajouter, modifier ou désactiver
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Créer un département</p>
                  <p className="text-sm text-muted-foreground">
                    Organiser l'équipe médicale
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Nouveau projet</p>
                  <p className="text-sm text-muted-foreground">
                    Collaboration client-équipe
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rôle:</strong> {user.role}</p>
            <p><strong>Type:</strong> {user.userType}</p>
            {user.departmentId && <p><strong>Département:</strong> {user.departmentId}</p>}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  )
}