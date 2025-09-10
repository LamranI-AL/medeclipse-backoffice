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

const evaluationFormSchema = z.object({
  employeeId: z.string().min(1, 'Employé requis'),
  evaluatorId: z.string().min(1, 'Évaluateur requis'),
  period: z.string().min(1, 'Période requise'),
  evaluationDate: z.string().min(1, 'Date d\'évaluation requise'),
  
  // Critères d'évaluation (1-5)
  technicalSkills: z.string().min(1, 'Note requise'),
  communication: z.string().min(1, 'Note requise'),
  teamwork: z.string().min(1, 'Note requise'),
  initiative: z.string().min(1, 'Note requise'),
  punctuality: z.string().min(1, 'Note requise'),
  
  // Commentaires
  strengths: z.string().min(10, 'Minimum 10 caractères'),
  improvements: z.string().min(10, 'Minimum 10 caractères'),
  goals: z.string().min(10, 'Minimum 10 caractères'),
  
  // Recommandations
  overallRating: z.string().min(1, 'Note globale requise'),
  recommendation: z.string().min(1, 'Recommandation requise'),
  comments: z.string().optional(),
})

type EvaluationFormData = z.infer<typeof evaluationFormSchema>

interface EvaluationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<EvaluationFormData>
}

// Données mockées
const employees = [
  { id: '1', name: 'Dr. Marie Dubois' },
  { id: '2', name: 'Jean Martin' },
  { id: '3', name: 'Sarah Lefebvre' },
]

const evaluators = [
  { id: '1', name: 'Dr. Jean Martin - Chef de Service' },
  { id: '2', name: 'Marie Dubois - Responsable RH' },
  { id: '3', name: 'Pierre Durand - Directeur' },
]

const ratingOptions = [
  { value: '1', label: '1 - Insuffisant' },
  { value: '2', label: '2 - Passable' },
  { value: '3', label: '3 - Satisfaisant' },
  { value: '4', label: '4 - Bien' },
  { value: '5', label: '5 - Excellent' },
]

const recommendations = [
  { value: 'promotion', label: 'Promotion recommandée' },
  { value: 'maintain', label: 'Maintenir au poste actuel' },
  { value: 'training', label: 'Formation recommandée' },
  { value: 'improvement', label: 'Plan d\'amélioration' },
  { value: 'warning', label: 'Avertissement' },
]

export function EvaluationForm({ onSuccess, onCancel, initialData }: EvaluationFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || '',
      evaluatorId: initialData?.evaluatorId || '',
      period: initialData?.period || '',
      evaluationDate: initialData?.evaluationDate || new Date().toISOString().split('T')[0],
      technicalSkills: initialData?.technicalSkills || '',
      communication: initialData?.communication || '',
      teamwork: initialData?.teamwork || '',
      initiative: initialData?.initiative || '',
      punctuality: initialData?.punctuality || '',
      strengths: initialData?.strengths || '',
      improvements: initialData?.improvements || '',
      goals: initialData?.goals || '',
      overallRating: initialData?.overallRating || '',
      recommendation: initialData?.recommendation || '',
      comments: initialData?.comments || '',
    },
  })

  const onSubmit = async (values: EvaluationFormData) => {
    setIsLoading(true)
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Evaluation data:', values)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating evaluation:', error)
      form.setError('root', {
        message: 'Erreur lors de la création de l\'évaluation'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialData ? 'Modifier l\'Évaluation' : 'Nouvelle Évaluation'}
        </h2>
        <p className="text-muted-foreground">
          Créez ou modifiez une évaluation de performance d'employé
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
              <CardDescription>
                Employé évalué et évaluateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employé évalué *</FormLabel>
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
                  name="evaluatorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Évaluateur *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un évaluateur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {evaluators.map((evaluator) => (
                            <SelectItem key={evaluator.id} value={evaluator.id}>
                              {evaluator.name}
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Période évaluée *</FormLabel>
                      <FormControl>
                        <Input placeholder="2024 - 1er semestre" {...field} />
                      </FormControl>
                      <FormDescription>
                        Exemple: 2024 - 1er semestre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'évaluation *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Critères d'évaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Critères d'Évaluation</CardTitle>
              <CardDescription>
                Notez chaque critère de 1 (insuffisant) à 5 (excellent)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="technicalSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compétences techniques *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Noter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="communication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Noter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="teamwork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travail d'équipe *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Noter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="initiative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initiative *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Noter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="punctuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponctualité *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Noter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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

          {/* Commentaires détaillés */}
          <Card>
            <CardHeader>
              <CardTitle>Commentaires Détaillés</CardTitle>
              <CardDescription>
                Analyse qualitative de la performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points forts *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Décrivez les principales qualités et réussites..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Principales forces et réalisations de l'employé
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Axes d'amélioration *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Identifiez les domaines à améliorer..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Points à développer et compétences à renforcer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectifs pour la prochaine période *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Définissez les objectifs à atteindre..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Objectifs SMART pour la période suivante
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Évaluation globale */}
          <Card>
            <CardHeader>
              <CardTitle>Évaluation Globale</CardTitle>
              <CardDescription>
                Synthèse et recommandations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note globale *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Note générale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="recommendation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommandation *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une recommandation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recommendations.map((rec) => (
                            <SelectItem key={rec.value} value={rec.value}>
                              {rec.label}
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
                  name="comments"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Commentaires additionnels</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Observations supplémentaires, plan de développement..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Observations supplémentaires (optionnel)
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
                initialData ? 'Modifier l\'évaluation' : 'Créer l\'évaluation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}