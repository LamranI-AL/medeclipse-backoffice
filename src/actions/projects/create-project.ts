'use server'

import { z } from "zod"
import { db } from "@/lib/db/neon"
import { projects, workspaces } from "@/lib/db/schema"
import { requireRole } from "@/actions/auth/session"
import { revalidatePath } from "next/cache"

const createProjectSchema = z.object({
  name: z.string().min(2, "Nom du projet requis"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client requis"),
  departmentId: z.string().min(1, "Département requis"),
  managerId: z.string().min(1, "Manager requis"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
})

export async function createProject(formData: FormData) {
  try {
    // Vérifier les permissions
    const currentUser = await requireRole(['super_admin', 'admin'])
    
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      clientId: formData.get('clientId') as string,
      departmentId: formData.get('departmentId') as string,
      managerId: formData.get('managerId') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      budget: formData.get('budget') as string,
    }
    
    const validatedData = createProjectSchema.parse(data)
    
    // Créer le projet
    const [newProject] = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        clientId: validatedData.clientId,
        departmentId: validatedData.departmentId,
        managerId: validatedData.managerId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        budget: validatedData.budget ? parseFloat(validatedData.budget) : undefined,
        status: 'active',
        createdBy: currentUser.id,
      })
      .returning()
    
    // Créer automatiquement un workspace pour le projet
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        projectId: newProject.id,
        name: `Workspace ${validatedData.name}`,
        description: `Espace de collaboration pour le projet ${validatedData.name}`,
        isActive: true,
      })
      .returning()
    
    revalidatePath('/projects')
    revalidatePath('/dashboard/admin')
    
    return {
      success: true,
      data: {
        project: newProject,
        workspace: newWorkspace
      }
    }
    
  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la création du projet"
    }
  }
}