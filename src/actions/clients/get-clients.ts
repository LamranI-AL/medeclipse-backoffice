'use server'

import { db } from "@/lib/db/neon"
import { clients, projects } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
import { requireRole } from "@/actions/auth/session"

export async function getClients() {
  try {
    // Seuls les admins peuvent voir tous les clients
    await requireRole(['super_admin', 'admin'])
    
    const clientsList = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        contactEmail: clients.contactEmail,
        contactPhone: clients.contactPhone,
        contactPerson: clients.contactPerson,
        address: clients.address,
        isActive: clients.isActive,
        lastLogin: clients.lastLogin,
        emailVerified: clients.emailVerified,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        projectCount: count(projects.id),
      })
      .from(clients)
      .leftJoin(projects, eq(clients.id, projects.clientId))
      .groupBy(
        clients.id, 
        clients.companyName, 
        clients.contactEmail, 
        clients.contactPhone,
        clients.contactPerson,
        clients.address,
        clients.isActive,
        clients.lastLogin,
        clients.emailVerified,
        clients.createdAt,
        clients.updatedAt
      )
    
    return {
      success: true,
      data: clientsList
    }
    
  } catch (error) {
    console.error('Error fetching clients:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des clients",
      data: []
    }
  }
}

export async function getClientById(id: string) {
  try {
    const currentUser = await requireRole(['super_admin', 'admin', 'client'])
    
    // Un client ne peut voir que ses propres informations
    if (currentUser.role === 'client' && currentUser.id !== id) {
      return {
        success: false,
        error: "Accès non autorisé"
      }
    }
    
    const [client] = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        contactEmail: clients.contactEmail,
        contactPhone: clients.contactPhone,
        contactPerson: clients.contactPerson,
        address: clients.address,
        isActive: clients.isActive,
        lastLogin: clients.lastLogin,
        emailVerified: clients.emailVerified,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1)
    
    if (!client) {
      return {
        success: false,
        error: "Client non trouvé"
      }
    }
    
    // Récupérer le nombre de projets
    const [projectCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.clientId, id))
    
    return {
      success: true,
      data: {
        ...client,
        projectCount: projectCount.count
      }
    }
    
  } catch (error) {
    console.error('Error fetching client:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération du client"
    }
  }
}

export async function getActiveClients() {
  try {
    await requireRole(['super_admin', 'admin', 'dept_manager'])
    
    const activeClients = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        contactEmail: clients.contactEmail,
        contactPerson: clients.contactPerson,
      })
      .from(clients)
      .where(eq(clients.isActive, true))
      .orderBy(clients.companyName)
    
    return {
      success: true,
      data: activeClients
    }
    
  } catch (error) {
    console.error('Error fetching active clients:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des clients actifs",
      data: []
    }
  }
}

export async function searchClients(searchTerm: string) {
  try {
    await requireRole(['super_admin', 'admin'])
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: false,
        error: "Le terme de recherche doit contenir au moins 2 caractères",
        data: []
      }
    }
    
    const searchResults = await db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        contactEmail: clients.contactEmail,
        contactPerson: clients.contactPerson,
        isActive: clients.isActive,
      })
      .from(clients)
      .where(
        or(
          ilike(clients.companyName, `%${searchTerm}%`),
          ilike(clients.contactEmail, `%${searchTerm}%`),
          ilike(clients.contactPerson, `%${searchTerm}%`)
        )
      )
      .limit(20)
    
    return {
      success: true,
      data: searchResults
    }
    
  } catch (error) {
    console.error('Error searching clients:', error)
    return {
      success: false,
      error: "Erreur lors de la recherche de clients",
      data: []
    }
  }
}