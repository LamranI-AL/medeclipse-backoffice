import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Plus, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { getPositions } from '@/actions/hr/positions/get-positions'

const levelColors = {
  junior: 'bg-blue-100 text-blue-800',
  senior: 'bg-green-100 text-green-800',
  lead: 'bg-purple-100 text-purple-800',
  manager: 'bg-orange-100 text-orange-800',
  director: 'bg-red-100 text-red-800'
}

export default async function PositionsPage() {
  const result = await getPositions()
  
  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erreur</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    )
  }

  const positions = result.data
  const totalPositions = positions.length
  const totalEmployees = positions.reduce((sum, pos) => sum + pos.employeeCount, 0)
  const averageSalary = positions.length > 0 ? Math.round(
    positions.reduce((sum, pos) => sum + (pos.baseSalary || 0), 0) / positions.length
  ) : 0

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Postes</h1>
          <p className="text-muted-foreground">
            Gestion des postes et fonctions MedEclipse
          </p>
        </div>
        <Link href="/positions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau poste
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Postes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground">Types de postes différents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Affectés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Sur ces postes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salaire Moyen</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSalary.toLocaleString('fr-FR')}€</div>
            <p className="text-xs text-muted-foreground">Salaire de base annuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des postes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positions.map((position) => (
          <Card key={position.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span>{position.title}</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge className={levelColors[position.level.toLowerCase() as keyof typeof levelColors]}>
                    {position.level}
                  </Badge>
                  <Badge variant="secondary">
                    {position.employeeCount} employés
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {position.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    Département:
                  </span>
                  <span className="text-sm font-medium">{position.department || 'Non assigné'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Salaire de base:</span>
                  <span className="text-sm font-medium">
                    {position.baseSalary ? position.baseSalary.toLocaleString('fr-FR') + ' € /an' : 'Non défini'}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Prérequis:</p>
                  <p className="text-xs">{position.requirements || 'Aucun prérequis spécifié'}</p>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    Voir détails
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}