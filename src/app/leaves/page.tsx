import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Users, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// Données mockées
const leaves = [
  {
    id: '1',
    employee: 'Dr. Marie Dubois',
    type: 'vacation',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    totalDays: 7,
    status: 'approved',
    reason: 'Congés annuels - vacances familiales',
    requestDate: '2024-02-20'
  },
  {
    id: '2',
    employee: 'Jean Martin',
    type: 'sick',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    totalDays: 3,
    status: 'approved',
    reason: 'Arrêt maladie - grippe',
    requestDate: '2024-03-09'
  },
  {
    id: '3',
    employee: 'Sarah Lefebvre',
    type: 'family',
    startDate: '2024-03-25',
    endDate: '2024-03-26',
    totalDays: 2,
    status: 'pending',
    reason: 'Congé familial - événement personnel',
    requestDate: '2024-03-05'
  },
  {
    id: '4',
    employee: 'Pierre Durand',
    type: 'training',
    startDate: '2024-04-01',
    endDate: '2024-04-03',
    totalDays: 3,
    status: 'pending',
    reason: 'Formation continue - séminaire médical',
    requestDate: '2024-03-01'
  }
]

const leaveTypeLabels = {
  vacation: 'Congés payés',
  sick: 'Congé maladie',
  maternity: 'Congé maternité',
  paternity: 'Congé paternité',
  family: 'Congé familial',
  training: 'Formation',
  unpaid: 'Congé sans solde'
}

const leaveTypeColors = {
  vacation: 'bg-blue-100 text-blue-800',
  sick: 'bg-red-100 text-red-800',
  maternity: 'bg-pink-100 text-pink-800',
  paternity: 'bg-purple-100 text-purple-800',
  family: 'bg-green-100 text-green-800',
  training: 'bg-yellow-100 text-yellow-800',
  unpaid: 'bg-gray-100 text-gray-800'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  cancelled: 'Annulé'
}

export default function LeavesPage() {
  const totalLeaves = leaves.length
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length
  const totalDaysThisMonth = leaves
    .filter(l => new Date(l.startDate).getMonth() === new Date().getMonth())
    .reduce((sum, l) => sum + l.totalDays, 0)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Congés & Absences</h1>
          <p className="text-muted-foreground">
            Gestion des demandes de congé MedEclipse
          </p>
        </div>
        <Link href="/leaves/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeaves}</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLeaves}</div>
            <p className="text-xs text-muted-foreground">Validées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours d'Absence</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysThisMonth}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Congé</CardTitle>
          <CardDescription>
            Vue d'ensemble de toutes les demandes d'absence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{leave.employee}</h3>
                    <p className="text-sm text-muted-foreground">
                      {leave.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Du {new Date(leave.startDate).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(leave.endDate).toLocaleDateString('fr-FR')} ({leave.totalDays} jours)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={leaveTypeColors[leave.type as keyof typeof leaveTypeColors]}>
                    {leaveTypeLabels[leave.type as keyof typeof leaveTypeLabels]}
                  </Badge>
                  
                  <Badge className={statusColors[leave.status as keyof typeof statusColors]}>
                    {statusLabels[leave.status as keyof typeof statusLabels]}
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground">
                    Demandé le {new Date(leave.requestDate).toLocaleDateString('fr-FR')}
                  </div>
                  
                  <div className="flex space-x-2">
                    {leave.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                          Approuver
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Refuser
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      Détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Planning des congés */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Planning des Congés</CardTitle>
          <CardDescription>
            Vue calendrier des absences planifiées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Calendar className="h-8 w-8 mr-2" />
            <span>Vue calendrier à venir - intégration d'un composant calendrier</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}