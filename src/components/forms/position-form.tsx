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

const positionFormSchema = z.object({
  title: z.string().min(2, 'Le titre du poste doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Département requis'),
  level: z.string().min(1, 'Niveau requis'),
  baseSalary: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
})

type PositionFormData = z.infer<typeof positionFormSchema>

interface PositionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<PositionFormData>
}

// Données mockées
const departments = [
  { id: '1', name: 'Cardiologie' },
  { id: '2', name: 'Urgences' },
  { id: '3', name: 'Médecine Générale' },
  { id: '4', name: 'Chirurgie' },
  { id: '5', name: 'Administration' },
]

const levels = [
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Directeur' },
]

export function PositionForm({ onSuccess, onCancel, initialData }: PositionFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      departmentId: initialData?.departmentId || '',
      level: initialData?.level || '',
      baseSalary: initialData?.baseSalary || '',
      requirements: initialData?.requirements || '',
      responsibilities: initialData?.responsibilities || '',
    },
  })

  const onSubmit = async (values: PositionFormData) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      if (values.description) formData.append('description', values.description)
      formData.append('departmentId', values.departmentId)
      formData.append('level', values.level)
      if (values.baseSalary) formData.append('baseSalary', values.baseSalary)
      if (values.requirements) formData.append('requirements', values.requirements)
      if (values.responsibilities) formData.append('responsibilities', values.responsibilities)

      const { createPosition } = await import('@/actions/hr/positions/create-position')
      const result = await createPosition(formData)
      
      if (result.success) {
        form.reset()
        onSuccess?.()
      } else {
        form.setError('root', {
          message: result.error || 'Erreur lors de la création du poste'
        })
      }
    } catch (error) {
      console.error('Error creating position:', error)
      form.setError('root', {
        message: 'Erreur lors de la création du poste'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Modifier le Poste' : 'Nouveau Poste'}
        </h2>
        <p className="text-muted-foreground">
          Créez ou modifiez les informations d'un poste
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du Poste</CardTitle>
              <CardDescription>
                Détails du poste et du département
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Titre du poste *</FormLabel>
                      <FormControl>
                        <Input placeholder="Médecin Généraliste" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
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
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un niveau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
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
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire de base</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description du poste</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Consultation et suivi des patients en médecine générale..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Description générale du poste
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Prérequis et qualifications</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Diplôme de médecine, spécialisation requise..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Diplômes, certifications et expérience requis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Responsabilités principales</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Consultation, diagnostic, prescription..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Principales tâches et responsabilités
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
                initialData ? 'Modifier le poste' : 'Créer le poste'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}