import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

// Données mockées
const contracts = [
  {
    id: '1',
    employee: 'Dr. Marie Dubois',
    type: 'CDI',
    position: 'Médecin Généraliste',
    department: 'Médecine Générale',
    startDate: '2023-01-15',
    endDate: null,
    salary: 65000,
    workingHours: 35,
    status: 'active'
  },
  {
    id: '2',
    employee: 'Jean Martin',
    type: 'CDI',
    position: 'Infirmier',
    department: 'Urgences',
    startDate: '2023-03-20',
    endDate: null,
    salary: 32000,
    workingHours: 35,
    status: 'active'
  },
  {
    id: '3',
    employee: 'Sarah Lefebvre',
    type: 'CDD',
    position: 'Assistant Administratif',
    department: 'Administration',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    salary: 28000,
    workingHours: 35,
    status: 'active'
  },
  {
    id: '4',
    employee: 'Pierre Durand',
    type: 'Stage',
    position: 'Stagiaire Infirmier',
    department: 'Cardiologie',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    salary: 600,
    workingHours: 35,
    status: 'active'
  }
]

const contractTypeColors = {
  CDI: 'bg-green-100 text-green-800',
  CDD: 'bg-blue-100 text-blue-800',
  Stage: 'bg-purple-100 text-purple-800',
  Freelance: 'bg-orange-100 text-orange-800',
  Interim: 'bg-yellow-100 text-yellow-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-gray-100 text-gray-800'
}

export default function ContractsPage() {
  const totalContracts = contracts.length
  const activeContracts = contracts.filter(c => c.status === 'active').length
  const cdiCount = contracts.filter(c => c.type === 'CDI').length
  const cddCount = contracts.filter(c => c.type === 'CDD').length

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contrats</h1>
          <p className="text-muted-foreground">
            Gestion des contrats de travail MedEclipse
          </p>
        </div>
        <Link href="/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contrat
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contrats</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">Tous types confondus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContracts}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDI</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cdiCount}</div>
            <p className="text-xs text-muted-foreground">Durée indéterminée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDD</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cddCount}</div>
            <p className="text-xs text-muted-foreground">Durée déterminée</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des contrats */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Contrats</CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les contrats de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{contract.employee}</h3>
                    <p className="text-sm text-muted-foreground">
                      {contract.position} • {contract.department}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Début: {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                      {contract.endDate && (
                        <> • Fin: {new Date(contract.endDate).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={contractTypeColors[contract.type as keyof typeof contractTypeColors]}>
                    {contract.type}
                  </Badge>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {contract.salary.toLocaleString('fr-FR')} € /an
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contract.workingHours}h/semaine
                    </div>
                  </div>
                  
                  <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                    {contract.status === 'active' ? 'Actif' : contract.status}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Voir
                    </Button>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}