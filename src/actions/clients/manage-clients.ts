'use server'

import { z } from "zod"
import { db } from "@/lib/db/neon"
import { clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireRole, getCurrentUser } from "@/actions/auth/session"
import { revalidatePath } from "next/cache"

const updateClientSchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  contactPerson: z.string().min(2, "Personne de contact requise"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
})

export async function updateClient(clientId: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "Authentification requise" }
    }
    
    // Vérifier les permissions
    const canUpdate = 
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      (currentUser.role === 'client' && currentUser.id === clientId)
    
    if (!canUpdate) {
      return {
        success: false,
        error: "Permissions insuffisantes"
      }
    }
    
    const data = {
      companyName: formData.get('companyName') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
      address: formData.get('address') as string,
    }
    
    const validatedData = updateClientSchema.parse(data)
    
    // Préparer les données d'adresse
    const addressData = validatedData.address ? {
      street: validatedData.address,
    } : undefined
    
    // Mettre à jour le client
    const [updatedClient] = await db
      .update(clients)
      .set({
        companyName: validatedData.companyName,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone || null,
        address: addressData,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))
      .returning()
    
    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    
    return {
      success: true,
      data: updatedClient
    }
    
  } catch (error) {
    console.error('Error updating client:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la mise à jour du client"
    }
  }
}

export async function toggleClientStatus(clientId: string) {
  try {
    await requireRole(['super_admin', 'admin'])
    
    // Récupérer le statut actuel
    const [client] = await db
      .select({ isActive: clients.isActive })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)
    
    if (!client) {
      return {
        success: false,
        error: "Client non trouvé"
      }
    }
    
    // Inverser le statut
    const [updatedClient] = await db
      .update(clients)
      .set({
        isActive: !client.isActive,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning()
    
    revalidatePath('/clients')
    
    return {
      success: true,
      data: updatedClient,
      message: updatedClient.isActive ? "Client activé" : "Client désactivé"
    }
    
  } catch (error) {
    console.error('Error toggling client status:', error)
    return {
      success: false,
      error: "Erreur lors du changement de statut"
    }
  }
}

export async function deleteClient(clientId: string) {
  try {
    await requireRole(['super_admin'])
    
    // Vérifier qu'il n'y a pas de projets associés
    const associatedProjects = await db.query.projects.findMany({
      where: eq(projects.clientId, clientId)
    })
    
    if (associatedProjects.length > 0) {
      return {
        success: false,
        error: `Impossible de supprimer ce client car il a ${associatedProjects.length} projet(s) associé(s)`
      }
    }
    
    // Supprimer le client
    await db
      .delete(clients)
      .where(eq(clients.id, clientId))
    
    revalidatePath('/clients')
    
    return {
      success: true,
      message: "Client supprimé avec succès"
    }
    
  } catch (error) {
    console.error('Error deleting client:', error)
    return {
      success: false,
      error: "Erreur lors de la suppression du client"
    }
  }
}

export async function updateClientProfile(formData: FormData) {
  try {
    const currentUser = await requireRole(['client'])
    
    const data = {
      companyName: formData.get('companyName') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
      address: formData.get('address') as string,
    }
    
    const validatedData = updateClientSchema.parse(data)
    
    const addressData = validatedData.address ? {
      street: validatedData.address,
    } : undefined
    
    const [updatedProfile] = await db
      .update(clients)
      .set({
        companyName: validatedData.companyName,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone || null,
        address: addressData,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, currentUser.id))
      .returning()
    
    revalidatePath('/profile')
    
    return {
      success: true,
      data: updatedProfile,
      message: "Profil mis à jour avec succès"
    }
    
  } catch (error) {
    console.error('Error updating client profile:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la mise à jour du profil"
    }
  }
}

export async function getClientStats() {
  try {
    await requireRole(['super_admin', 'admin'])
    
    // Statistiques de base
    const [totalClients] = await db
      .select({ count: count() })
      .from(clients)
    
    const [activeClients] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.isActive, true))
    
    const [inactiveClients] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.isActive, false))
    
    // Clients avec des projets actifs
    const [clientsWithActiveProjects] = await db
      .select({ count: count(distinct(clients.id)) })
      .from(clients)
      .leftJoin(projects, eq(clients.id, projects.clientId))
      .where(eq(projects.status, 'active'))
    
    return {
      success: true,
      data: {
        total: totalClients.count,
        active: activeClients.count,
        inactive: inactiveClients.count,
        withActiveProjects: clientsWithActiveProjects.count
      }
    }
    
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des statistiques"
    }
  }
}