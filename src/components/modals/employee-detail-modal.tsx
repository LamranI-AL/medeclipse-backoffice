'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  Calendar,
  Edit,
  Trash2,
  UserCheck
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  status: string
  startDate: string
  email: string
  phone?: string
  address?: string
  emergencyContact?: string
  manager?: string
  salary?: number
}

interface EmployeeDetailModalProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
}

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

export function EmployeeDetailModal({ 
  employee, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: EmployeeDetailModalProps) {
  if (!employee) return null

  const handleEdit = () => {
    onEdit(employee)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'employé ${employee.name} ?`)) {
      onDelete(employee.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Détails de l'employé</span>
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur {employee.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec photo et infos principales */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xl font-bold">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
                    <p className="text-muted-foreground">{employee.position}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Building2 className="h-4 w-4 mr-1" />
                      {employee.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[employee.status as keyof typeof statusColors]}>
                    {statusLabels[employee.status as keyof typeof statusLabels]}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Informations Personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                )}
                {employee.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Embauché le {new Date(employee.startDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Informations professionnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Informations Professionnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Poste</p>
                  <p className="font-medium">{employee.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Département</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
                {employee.manager && (
                  <div>
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p className="font-medium">{employee.manager}</p>
                  </div>
                )}
                {employee.salary && (
                  <div>
                    <p className="text-sm text-muted-foreground">Salaire annuel</p>
                    <p className="font-medium">{employee.salary.toLocaleString('fr-FR')} €</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact d'urgence */}
          {employee.emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Contact d'Urgence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{employee.emergencyContact}</p>
              </CardContent>
            </Card>
          )}

          {/* Historique rapide */}
          <Card>
            <CardHeader>
              <CardTitle>Historique Récent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Date d'embauche</span>
                  <span>{new Date(employee.startDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span>Dernière évaluation</span>
                  <span className="text-muted-foreground">Aucune</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span>Congés restants</span>
                  <span>25 jours</span>
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
            Modifier l'employé
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}