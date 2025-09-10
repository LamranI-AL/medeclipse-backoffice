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

const departmentFormSchema = z.object({
  name: z.string().min(2, 'Le nom du département doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().min(1, 'Localisation requise'),
  budget: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentFormSchema>

interface DepartmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<DepartmentFormData>
}

// Données mockées pour les managers
const managers = [
  { id: '1', name: 'Dr. Marie Dubois' },
  { id: '2', name: 'Dr. Jean Martin' },
  { id: '3', name: 'Sarah Lefebvre' },
]

export function DepartmentForm({ onSuccess, onCancel, initialData }: DepartmentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      managerId: initialData?.managerId || '',
      location: initialData?.location || '',
      budget: initialData?.budget || '',
    },
  })

  const onSubmit = async (values: DepartmentFormData) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      if (values.description) formData.append('description', values.description)
      if (values.managerId) formData.append('managerId', values.managerId)
      formData.append('location', values.location)
      if (values.budget) formData.append('budget', values.budget)

      const { createDepartment } = await import('@/actions/hr/departments/create-department')
      const result = await createDepartment(formData)
      
      if (result.success) {
        form.reset()
        onSuccess?.()
      } else {
        form.setError('root', {
          message: result.error || 'Erreur lors de la création du département'
        })
      }
    } catch (error) {
      console.error('Error creating department:', error)
      form.setError('root', {
        message: 'Erreur lors de la création du département'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Modifier le Département' : 'Nouveau Département'}
        </h2>
        <p className="text-muted-foreground">
          Créez ou modifiez les informations d'un département
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du Département</CardTitle>
              <CardDescription>
                Détails généraux du département
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nom du département *</FormLabel>
                      <FormControl>
                        <Input placeholder="Cardiologie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Service de cardiologie interventionnelle..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Description optionnelle du département
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chef de département</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Aucun manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bâtiment A - Étage 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Budget annuel</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="150000"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Budget annuel en euros (optionnel)
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
                initialData ? 'Modifier le département' : 'Créer le département'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}