'use server'

import { z } from "zod"
import { db } from "@/lib/db/neon"
import { workspaces, workspaceMembers, projects } from "@/lib/db/schema"
import { requireAuth } from "@/actions/auth/session"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const addMemberSchema = z.object({
  userId: z.string().min(1, "Utilisateur requis"),
  userType: z.enum(['employee', 'client']),
  role: z.enum(['admin', 'member', 'observer']).default('member'),
})

export async function getWorkspacesByUser() {
  try {
    const currentUser = await requireAuth()
    
    // Récupérer les workspaces où l'utilisateur est membre
    const userWorkspaces = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        workspaceName: workspaces.name,
        workspaceDescription: workspaces.description,
        projectId: workspaces.projectId,
        projectName: projects.name,
      })
      .from(workspaceMembers)
      .leftJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .leftJoin(projects, eq(workspaces.projectId, projects.id))
      .where(
        and(
          eq(workspaceMembers.userId, currentUser.id),
          eq(workspaceMembers.userType, currentUser.userType),
          eq(workspaces.isActive, true)
        )
      )
    
    return {
      success: true,
      data: userWorkspaces
    }
    
  } catch (error) {
    console.error('Error fetching user workspaces:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des workspaces",
      data: []
    }
  }
}

export async function getWorkspaceMembers(workspaceId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Vérifier si l'utilisateur a accès à ce workspace
    const memberAccess = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, currentUser.id),
          eq(workspaceMembers.userType, currentUser.userType)
        )
      )
      .limit(1)
    
    if (!memberAccess[0] && currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      return {
        success: false,
        error: "Accès non autorisé à ce workspace"
      }
    }
    
    // Récupérer tous les membres du workspace avec leurs informations
    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        userType: workspaceMembers.userType,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))
    
    // Enrichir avec les informations des utilisateurs
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        if (member.userType === 'employee') {
          const employee = await db.query.employees.findFirst({
            where: eq(employees.id, member.userId),
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              departmentId: true,
            }
          })
          
          return {
            ...member,
            name: employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu',
            email: employee?.email,
            departmentId: employee?.departmentId
          }
        } else {
          const client = await db.query.clients.findFirst({
            where: eq(clients.id, member.userId),
            columns: {
              id: true,
              companyName: true,
              contactEmail: true,
            }
          })
          
          return {
            ...member,
            name: client?.companyName || 'Client inconnu',
            email: client?.contactEmail
          }
        }
      })
    )
    
    return {
      success: true,
      data: enrichedMembers
    }
    
  } catch (error) {
    console.error('Error fetching workspace members:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des membres",
      data: []
    }
  }
}

export async function addWorkspaceMember(workspaceId: string, formData: FormData) {
  try {
    const currentUser = await requireAuth()
    
    const data = {
      userId: formData.get('userId') as string,
      userType: formData.get('userType') as 'employee' | 'client',
      role: formData.get('role') as 'admin' | 'member' | 'observer' || 'member',
    }
    
    const validatedData = addMemberSchema.parse(data)
    
    // Vérifier les permissions - seuls les admins du workspace ou les admins système peuvent ajouter des membres
    const canAddMember = currentUser.role === 'super_admin' || 
                        currentUser.role === 'admin' ||
                        await isWorkspaceAdmin(currentUser.id, currentUser.userType, workspaceId)
    
    if (!canAddMember) {
      return {
        success: false,
        error: "Permissions insuffisantes pour ajouter des membres"
      }
    }
    
    // Vérifier si l'utilisateur n'est pas déjà membre
    const existingMember = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, validatedData.userId),
          eq(workspaceMembers.userType, validatedData.userType)
        )
      )
      .limit(1)
    
    if (existingMember[0]) {
      return {
        success: false,
        error: "Cet utilisateur est déjà membre du workspace"
      }
    }
    
    // Ajouter le membre
    const [newMember] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId: validatedData.userId,
        userType: validatedData.userType,
        role: validatedData.role,
      })
      .returning()
    
    revalidatePath(`/workspaces/${workspaceId}`)
    
    return {
      success: true,
      data: newMember
    }
    
  } catch (error) {
    console.error('Error adding workspace member:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de l'ajout du membre"
    }
  }
}

export async function removeWorkspaceMember(workspaceId: string, memberId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Vérifier les permissions
    const canRemoveMember = currentUser.role === 'super_admin' || 
                           currentUser.role === 'admin' ||
                           await isWorkspaceAdmin(currentUser.id, currentUser.userType, workspaceId)
    
    if (!canRemoveMember) {
      return {
        success: false,
        error: "Permissions insuffisantes pour supprimer des membres"
      }
    }
    
    // Supprimer le membre
    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.workspaceId, workspaceId)
        )
      )
    
    revalidatePath(`/workspaces/${workspaceId}`)
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return {
      success: false,
      error: "Erreur lors de la suppression du membre"
    }
  }
}

// Fonction utilitaire pour vérifier si un utilisateur est admin du workspace
async function isWorkspaceAdmin(userId: string, userType: string, workspaceId: string): Promise<boolean> {
  const admin = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.userType, userType),
        eq(workspaceMembers.role, 'admin')
      )
    )
    .limit(1)
  
  return !!admin[0]
}