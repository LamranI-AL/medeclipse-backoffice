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

const contractFormSchema = z.object({
  employeeId: z.string().min(1, 'Employé requis'),
  contractType: z.string().min(1, 'Type de contrat requis'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().optional(),
  salary: z.string().min(1, 'Salaire requis'),
  workingHours: z.string().min(1, 'Heures de travail requises'),
  trialPeriod: z.string().optional(),
  department: z.string().min(1, 'Département requis'),
  position: z.string().min(1, 'Poste requis'),
  benefits: z.string().optional(),
})

type ContractFormData = z.infer<typeof contractFormSchema>

interface ContractFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ContractFormData>
}

// Données mockées
const employees = [
  { id: '1', name: 'Dr. Marie Dubois' },
  { id: '2', name: 'Jean Martin' },
  { id: '3', name: 'Sarah Lefebvre' },
]

const contractTypes = [
  { value: 'cdi', label: 'CDI - Contrat à Durée Indéterminée' },
  { value: 'cdd', label: 'CDD - Contrat à Durée Déterminée' },
  { value: 'stage', label: 'Stage' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'interim', label: 'Intérim' },
]

const departments = [
  { id: '1', name: 'Cardiologie' },
  { id: '2', name: 'Urgences' },
  { id: '3', name: 'Médecine Générale' },
  { id: '4', name: 'Administration' },
]

const positions = [
  { id: '1', title: 'Médecin Généraliste' },
  { id: '2', title: 'Infirmier(ère)' },
  { id: '3', title: 'Assistant Administratif' },
]

export function ContractForm({ onSuccess, onCancel, initialData }: ContractFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || '',
      contractType: initialData?.contractType || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      salary: initialData?.salary || '',
      workingHours: initialData?.workingHours || '35',
      trialPeriod: initialData?.trialPeriod || '',
      department: initialData?.department || '',
      position: initialData?.position || '',
      benefits: initialData?.benefits || '',
    },
  })

  const selectedContractType = form.watch('contractType')

  const onSubmit = async (values: ContractFormData) => {
    setIsLoading(true)
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Contract data:', values)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating contract:', error)
      form.setError('root', {
        message: 'Erreur lors de la création du contrat'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Modifier le Contrat' : 'Nouveau Contrat'}
        </h2>
        <p className="text-muted-foreground">
          Créez ou modifiez les informations contractuelles d'un employé
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
              <CardDescription>
                Employé et type de contrat
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
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractTypes.map((type) => (
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

          {/* Période et durée */}
          <Card>
            <CardHeader>
              <CardTitle>Période et Durée</CardTitle>
              <CardDescription>
                Dates de début, fin et période d'essai
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

                {selectedContractType === 'cdd' && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Requis pour les CDD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="trialPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Période d'essai</FormLabel>
                      <FormControl>
                        <Input placeholder="3 mois" {...field} />
                      </FormControl>
                      <FormDescription>
                        Durée de la période d'essai
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Poste et rémunération */}
          <Card>
            <CardHeader>
              <CardTitle>Poste et Rémunération</CardTitle>
              <CardDescription>
                Affectation et conditions salariales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un département" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
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
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un poste" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.title}
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
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire annuel brut *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="45000"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Salaire annuel brut en euros
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heures de travail/semaine *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="35"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Nombre d'heures hebdomadaires
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Avantages et bénéfices</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Mutuelle, tickets restaurant, prime annuelle..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Avantages sociaux et autres bénéfices
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                initialData ? 'Modifier le contrat' : 'Créer le contrat'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}