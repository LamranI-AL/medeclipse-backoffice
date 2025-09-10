import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCheck, Plus, TrendingUp, Star, Clock } from 'lucide-react'
import Link from 'next/link'

// Données mockées
const evaluations = [
  {
    id: '1',
    employee: 'Dr. Marie Dubois',
    evaluator: 'Dr. Jean Martin',
    period: '2024 - 1er semestre',
    evaluationDate: '2024-02-15',
    overallRating: 4.5,
    status: 'completed',
    nextDue: '2024-08-15',
    department: 'Médecine Générale'
  },
  {
    id: '2',
    employee: 'Jean Martin',
    evaluator: 'Dr. Sophie Durand',
    period: '2024 - 1er semestre',
    evaluationDate: '2024-02-20',
    overallRating: 4.2,
    status: 'completed',
    nextDue: '2024-08-20',
    department: 'Urgences'
  },
  {
    id: '3',
    employee: 'Sarah Lefebvre',
    evaluator: 'Marie Dubois',
    period: '2024 - 1er semestre',
    evaluationDate: null,
    overallRating: null,
    status: 'pending',
    nextDue: '2024-03-30',
    department: 'Administration'
  },
  {
    id: '4',
    employee: 'Pierre Durand',
    evaluator: 'Dr. Jean Martin',
    period: '2024 - Stage',
    evaluationDate: null,
    overallRating: null,
    status: 'in_progress',
    nextDue: '2024-04-15',
    department: 'Cardiologie'
  }
]

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-red-100 text-red-800',
  overdue: 'bg-red-100 text-red-800'
}

const statusLabels = {
  completed: 'Terminée',
  in_progress: 'En cours',
  pending: 'En attente',
  overdue: 'En retard'
}

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return 'text-green-600'
  if (rating >= 3.5) return 'text-blue-600'
  if (rating >= 2.5) return 'text-yellow-600'
  return 'text-red-600'
}

const getRatingLabel = (rating: number) => {
  if (rating >= 4.5) return 'Excellent'
  if (rating >= 3.5) return 'Bien'
  if (rating >= 2.5) return 'Satisfaisant'
  return 'À améliorer'
}

export default function EvaluationsPage() {
  const totalEvaluations = evaluations.length
  const completedEvaluations = evaluations.filter(e => e.status === 'completed').length
  const pendingEvaluations = evaluations.filter(e => e.status === 'pending').length
  const averageRating = evaluations
    .filter(e => e.overallRating !== null)
    .reduce((sum, e) => sum + (e.overallRating || 0), 0) / 
    evaluations.filter(e => e.overallRating !== null).length

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Évaluations</h1>
          <p className="text-muted-foreground">
            Gestion des évaluations de performance MedEclipse
          </p>
        </div>
        <Link href="/evaluations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle évaluation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Évaluations</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">Cette période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEvaluations}</div>
            <p className="text-xs text-muted-foreground">Complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">À réaliser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">Performance globale</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des évaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Évaluations</CardTitle>
          <CardDescription>
            Vue d'ensemble de toutes les évaluations de performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{evaluation.employee}</h3>
                    <p className="text-sm text-muted-foreground">
                      {evaluation.department} • Évaluateur: {evaluation.evaluator}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Période: {evaluation.period}
                      {evaluation.evaluationDate && (
                        <> • Évalué le {new Date(evaluation.evaluationDate).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {evaluation.overallRating && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getRatingColor(evaluation.overallRating)}`}>
                        {evaluation.overallRating.toFixed(1)}/5
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getRatingLabel(evaluation.overallRating)}
                      </div>
                    </div>
                  )}
                  
                  <Badge className={statusColors[evaluation.status as keyof typeof statusColors]}>
                    {statusLabels[evaluation.status as keyof typeof statusLabels]}
                  </Badge>
                  
                  <div className="text-sm text-muted-foreground text-right">
                    <div>Prochaine échéance:</div>
                    <div>{new Date(evaluation.nextDue).toLocaleDateString('fr-FR')}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {evaluation.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        Voir résultats
                      </Button>
                    )}
                    {evaluation.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        Commencer
                      </Button>
                    )}
                    {evaluation.status === 'in_progress' && (
                      <Button variant="outline" size="sm">
                        Continuer
                      </Button>
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

      {/* Analyse des performances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Tendances de Performance</span>
            </CardTitle>
            <CardDescription>
              Évolution des notes d'évaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mr-2" />
              <span>Graphique des tendances à venir</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Top Performers</span>
            </CardTitle>
            <CardDescription>
              Employés les mieux évalués
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluations
                .filter(e => e.overallRating !== null)
                .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
                .slice(0, 3)
                .map((evaluation, index) => (
                  <div key={evaluation.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{evaluation.employee}</span>
                    </div>
                    <div className={`text-sm font-bold ${getRatingColor(evaluation.overallRating || 0)}`}>
                      {evaluation.overallRating?.toFixed(1)}/5
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}