import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEmployeesStats } from '@/actions/hr/employees/get-employees'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Building2,
  FileText
} from 'lucide-react'

export default async function DashboardPage() {
  // Récupérer les statistiques (Server Component)
  const stats = await getEmployeesStats()

  const metrics = [
    {
      title: "Employés Actifs",
      value: stats.active.toString(),
      description: "Personnel en service",
      icon: Users,
      trend: "+2.5%",
      trendUp: true
    },
    {
      title: "En Congé",
      value: stats.onLeave.toString(),
      description: "Absence aujourd'hui",
      icon: Calendar,
      trend: "-1.2%",
      trendUp: false
    },
    {
      title: "Total Effectif",
      value: stats.total.toString(),
      description: "Tous statuts confondus",
      icon: Building2,
      trend: "+5.1%",
      trendUp: true
    },
    {
      title: "Taux de Présence",
      value: `${Math.round((stats.active / stats.total) * 100)}%`,
      description: "Personnel présent",
      icon: UserCheck,
      trend: "+0.8%",
      trendUp: true
    }
  ]

  const recentActivities = [
    {
      action: "Nouvel employé créé",
      user: "Dr. Marie Dubois",
      time: "Il y a 2h",
      type: "success"
    },
    {
      action: "Demande de congé en attente",
      user: "Jean Martin",
      time: "Il y a 4h",
      type: "pending"
    },
    {
      action: "Contrat renouvelé",
      user: "Sarah Lefebvre",
      time: "Il y a 6h",
      type: "success"
    },
    {
      action: "Évaluation en retard",
      user: "Pierre Moreau",
      time: "Il y a 1j",
      type: "warning"
    }
  ]

  const alerts = [
    {
      title: "3 Contrats expirent ce mois",
      description: "Renouvellement à planifier",
      priority: "high"
    },
    {
      title: "5 Évaluations en retard",
      description: "Action requise des managers",
      priority: "medium"
    },
    {
      title: "Formation obligatoire",
      description: "15 employés concernés",
      priority: "low"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard RH</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la gestion des ressources humaines MedEclipse
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{metric.description}</span>
                  <div className={`flex items-center ${
                    metric.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${
                      !metric.trendUp && 'rotate-180'
                    }`} />
                    {metric.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Activités Récentes
            </CardTitle>
            <CardDescription>
              Dernières actions dans le système RH
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alertes
            </CardTitle>
            <CardDescription>
              Points d'attention importants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground">
                    {alert.title}
                  </h4>
                  <Badge 
                    variant={
                      alert.priority === 'high' ? 'destructive' :
                      alert.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {alert.priority === 'high' ? 'Urgent' :
                     alert.priority === 'medium' ? 'Important' : 'Info'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Actions Rapides
          </CardTitle>
          <CardDescription>
            Raccourcis vers les actions les plus fréquentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium text-foreground">Nouvel Employé</h4>
                <p className="text-xs text-muted-foreground">Ajouter un employé</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition-colors cursor-pointer">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-foreground">Nouveau Contrat</h4>
                <p className="text-xs text-muted-foreground">Créer un contrat</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-foreground">Gérer Congés</h4>
                <p className="text-xs text-muted-foreground">Traiter les demandes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-foreground">Évaluations</h4>
                <p className="text-xs text-muted-foreground">Planning des évaluations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}