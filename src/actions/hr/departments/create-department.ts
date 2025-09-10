'use server'

import { z } from 'zod'
import { db } from '@/lib/db/neon'
import { departments } from '@/lib/db/schema'

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().min(1, 'Localisation requise'),
  budget: z.string().optional(),
})

export async function createDepartment(formData: FormData) {
  try {
    // Extraire les données du FormData
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      managerId: formData.get('managerId') as string || undefined,
      location: formData.get('location') as string,
      budget: formData.get('budget') as string || undefined,
    }

    // Valider les données
    const validatedData = createDepartmentSchema.parse(data)

    // Insérer en base de données
    const [newDepartment] = await db.insert(departments).values({
      name: validatedData.name,
      description: validatedData.description,
      managerId: validatedData.managerId,
      location: validatedData.location,
      budget: validatedData.budget ? parseInt(validatedData.budget) : null,
    }).returning()

    return {
      success: true,
      data: newDepartment
    }
  } catch (error) {
    console.error('Error creating department:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }

    return {
      success: false,
      error: 'Erreur lors de la création du département'
    }
  }
}