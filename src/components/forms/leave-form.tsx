'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const leaveFormSchema = z.object({
  employeeId: z.string().min(1, 'Employé requis'),
  leaveType: z.string().min(1, 'Type de congé requis'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  totalDays: z.string().min(1, 'Nombre de jours requis'),
  reason: z.string().min(10, 'Raison requise (minimum 10 caractères)'),
  emergencyContact: z.string().optional(),
  medicalCertificate: z.boolean().default(false),
  comments: z.string().optional(),
})

type LeaveFormData = z.infer<typeof leaveFormSchema>

interface LeaveFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<LeaveFormData>
}

// Données mockées
const employees = [
  { id: '1', name: 'Dr. Marie Dubois' },
  { id: '2', name: 'Jean Martin' },
  { id: '3', name: 'Sarah Lefebvre' },
]

const leaveTypes = [
  { value: 'vacation', label: 'Congés payés' },
  { value: 'sick', label: 'Congé maladie' },
  { value: 'maternity', label: 'Congé maternité' },
  { value: 'paternity', label: 'Congé paternité' },
  { value: 'family', label: 'Congé familial' },
  { value: 'training', label: 'Formation' },
  { value: 'unpaid', label: 'Congé sans solde' },
]

export function LeaveForm({ onSuccess, onCancel, initialData }: LeaveFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || '',
      leaveType: initialData?.leaveType || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      totalDays: initialData?.totalDays || '',
      reason: initialData?.reason || '',
      emergencyContact: initialData?.emergencyContact || '',
      medicalCertificate: initialData?.medicalCertificate || false,
      comments: initialData?.comments || '',
    },
  })

  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')
  const selectedLeaveType = form.watch('leaveType')

  // Calcul automatique des jours
  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      form.setValue('totalDays', diffDays.toString())
    }
  }, [startDate, endDate, form])

  const onSubmit = async (values: LeaveFormData) => {
    setIsLoading(true)
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Leave data:', values)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating leave:', error)
      form.setError('root', {
        message: 'Erreur lors de la création de la demande de congé'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Modifier la Demande' : 'Nouvelle Demande de Congé'}
        </h2>
        <p className="text-muted-foreground">
          Créez ou modifiez une demande de congé ou d'absence
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
              <CardDescription>
                Employé et type de congé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employé *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un employé" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de congé *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Période */}
          <Card>
            <CardHeader>
              <CardTitle>Période de Congé</CardTitle>
              <CardDescription>
                Dates de début et fin du congé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de jours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          readOnly
                          className="bg-muted"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Calculé automatiquement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Détails */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la Demande</CardTitle>
              <CardDescription>
                Motif et informations complémentaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif de la demande *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Congés annuels, repos familial, formation professionnelle..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Décrivez le motif de votre demande (minimum 10 caractères)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(selectedLeaveType === 'sick' || selectedLeaveType === 'maternity') && (
                <FormField
                  control={form.control}
                  name="medicalCertificate"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <div>
                        <FormLabel>Certificat médical fourni</FormLabel>
                        <FormDescription>
                          Obligatoire pour les congés maladie et maternité
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact d'urgence</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nom et téléphone de la personne à contacter"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Personne à contacter en cas d'urgence durant l'absence
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaires</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Informations supplémentaires..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Informations supplémentaires (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Erreur générale */}
          {form.formState.errors.root && (
            <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Modification...' : 'Création...'}
                </>
              ) : (
                initialData ? 'Modifier la demande' : 'Soumettre la demande'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}