'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { EmployeeDetailModal } from '@/components/modals/employee-detail-modal'

// Données mockées
const employees = [
  {
    id: '1',
    name: 'Dr. Marie Dubois',
    position: 'Médecin Généraliste',
    department: 'Médecine Générale',
    status: 'active',
    startDate: '2023-01-15',
    email: 'marie.dubois@medeclipse.com'
  },
  {
    id: '2',
    name: 'Jean Martin',
    position: 'Infirmier',
    department: 'Urgences',
    status: 'active',
    startDate: '2023-03-20',
    email: 'jean.martin@medeclipse.com'
  },
  {
    id: '3',
    name: 'Sarah Lefebvre',
    position: 'Assistant Administratif',
    department: 'Administration',
    status: 'on_leave',
    startDate: '2022-11-10',
    email: 'sarah.lefebvre@medeclipse.com'
  }
]

const statusLabels = {
  active: 'Actif',
  on_leave: 'En congé',
  inactive: 'Inactif',
  terminated: 'Terminé'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  terminated: 'bg-red-100 text-red-800'
}

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (employee: typeof employees[0]) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleEdit = (employee: typeof employees[0]) => {
    // Rediriger vers la page d'édition ou ouvrir un modal d'édition
    console.log('Edit employee:', employee)
  }

  const handleDelete = (employeeId: string) => {
    // Supprimer l'employé
    console.log('Delete employee:', employeeId)
  }
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employés</h1>
          <p className="text-muted-foreground">
            Gestion des employés MedEclipse
          </p>
        </div>
        <Link href="/employees/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel employé
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">+12 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">238</div>
            <p className="text-xs text-muted-foreground">97% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Congé</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des employés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Employés</CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les employés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {employee.position} • {employee.department}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={statusColors[employee.status as keyof typeof statusColors]}>
                    {statusLabels[employee.status as keyof typeof statusLabels]}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Depuis le {new Date(employee.startDate).toLocaleDateString('fr-FR')}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(employee)}
                  >
                    Voir détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal des détails */}
      <EmployeeDetailModal
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}