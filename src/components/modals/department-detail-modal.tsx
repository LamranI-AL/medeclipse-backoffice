'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Users, 
  MapPin, 
  DollarSign,
  User,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react'

interface Department {
  id: string
  name: string
  description?: string
  manager: string
  employeeCount: number
  location: string
  budget: number
  createdDate?: string
}

interface DepartmentDetailModalProps {
  department: Department | null
  isOpen: boolean
  onClose: () => void
  onEdit: (department: Department) => void
  onDelete: (departmentId: string) => void
}

export function DepartmentDetailModal({ 
  department, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: DepartmentDetailModalProps) {
  if (!department) return null

  const handleEdit = () => {
    onEdit(department)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le département ${department.name} ?`)) {
      onDelete(department.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Détails du département</span>
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur le département {department.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec infos principales */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{department.name}</h2>
                    {department.description && (
                      <p className="text-muted-foreground mt-1">{department.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary">
                        {department.employeeCount} employés
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Budget: {department.budget.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDelete} 
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Informations Générales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom du département</p>
                  <p className="font-medium">{department.name}</p>
                </div>
                {department.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{department.description}</p>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{department.location}</span>
                </div>
                {department.createdDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Créé le {new Date(department.createdDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ressources et budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Ressources & Budget</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Effectif</span>
                  </div>
                  <span className="font-medium">{department.employeeCount} employés</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Budget annuel</span>
                  </div>
                  <span className="font-medium">{department.budget.toLocaleString('fr-FR')} €</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Responsable</span>
                  </div>
                  <span className="font-medium">{department.manager}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Équipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Équipe du Département</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{department.manager}</p>
                      <p className="text-sm text-muted-foreground">Chef de département</p>
                    </div>
                  </div>
                  <Badge>Manager</Badge>
                </div>
                
                {/* Simulation d'autres employés */}
                <div className="text-sm text-muted-foreground text-center py-4">
                  + {department.employeeCount - 1} autres employés dans ce département
                </div>
                
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Voir tous les employés
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques du Département</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{department.employeeCount}</p>
                  <p className="text-sm text-muted-foreground">Employés actifs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(department.budget / department.employeeCount / 1000)}k€
                  </p>
                  <p className="text-sm text-muted-foreground">Budget/employé</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">4.2</p>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier le département
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}