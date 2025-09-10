'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import { DepartmentDetailModal } from '@/components/modals/department-detail-modal'

type Department = {
  id: string
  name: string
  description: string | null
  manager: string | null
  employeeCount: number
  location: string | null
  budget: number | null
}

interface DepartmentsClientProps {
  departments: Department[]
}

export function DepartmentsClient({ departments }: DepartmentsClientProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (department: Department) => {
    setSelectedDepartment(department)
    setIsModalOpen(true)
  }

  const handleEdit = (department: Department) => {
    console.log('Edit department:', department)
  }

  const handleDelete = (departmentId: string) => {
    console.log('Delete department:', departmentId)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>{department.name}</span>
                </CardTitle>
                <Badge variant="secondary">
                  {department.employeeCount} employés
                </Badge>
              </div>
              <CardDescription>
                {department.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Manager:</span>
                  <span className="text-sm font-medium">{department.manager || 'Non assigné'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Localisation:</span>
                  <span className="text-sm">{department.location || 'Non spécifiée'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Budget annuel:</span>
                  <span className="text-sm font-medium">
                    {department.budget ? department.budget.toLocaleString('fr-FR') + ' €' : 'Non défini'}
                  </span>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDetails(department)}
                  >
                    Voir détails
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(department)}
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DepartmentDetailModal
        department={selectedDepartment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  )
}