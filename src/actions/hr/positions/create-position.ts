'use server'

import { z } from 'zod'
import { db } from '@/lib/db/neon'
import { positions } from '@/lib/db/schema'

const createPositionSchema = z.object({
  title: z.string().min(2, 'Le titre doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Département requis'),
  level: z.string().min(1, 'Niveau requis'),
  baseSalary: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
})

export async function createPosition(formData: FormData) {
  try {
    // Extraire les données du FormData
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      departmentId: formData.get('departmentId') as string,
      level: formData.get('level') as string,
      baseSalary: formData.get('baseSalary') as string || undefined,
      requirements: formData.get('requirements') as string || undefined,
      responsibilities: formData.get('responsibilities') as string || undefined,
    }

    // Valider les données
    const validatedData = createPositionSchema.parse(data)

    // Insérer en base de données
    const [newPosition] = await db.insert(positions).values({
      title: validatedData.title,
      description: validatedData.description,
      departmentId: validatedData.departmentId,
      level: validatedData.level,
      baseSalary: validatedData.baseSalary ? parseInt(validatedData.baseSalary) : null,
      requirements: validatedData.requirements,
      responsibilities: validatedData.responsibilities,
    }).returning()

    return {
      success: true,
      data: newPosition
    }
  } catch (error) {
    console.error('Error creating position:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }

    return {
      success: false,
      error: 'Erreur lors de la création du poste'
    }
  }
}