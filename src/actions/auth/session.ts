'use server'

import { auth } from "@/lib/auth/config"
import { AuthUser } from "@/lib/db/schema"
import { headers } from "next/headers"
import { db } from "@/lib/db/neon"
import { employees, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) return null
    
    // Récupérer les informations complètes de l'utilisateur
    if (session.user.userType === 'employee') {
      const employee = await db
        .select({
          id: employees.id,
          email: employees.email,
          firstName: employees.firstName,
          lastName: employees.lastName,
          role: employees.role,
          departmentId: employees.departmentId,
          isActive: employees.isActive,
        })
        .from(employees)
        .where(eq(employees.id, session.user.id))
        .limit(1)
      
      if (employee[0]) {
        return {
          id: employee[0].id,
          email: employee[0].email,
          firstName: employee[0].firstName,
          lastName: employee[0].lastName,
          role: employee[0].role,
          userType: 'employee',
          departmentId: employee[0].departmentId,
          isActive: employee[0].isActive,
        }
      }
    }
    
    if (session.user.userType === 'client') {
      const client = await db
        .select({
          id: clients.id,
          email: clients.contactEmail,
          companyName: clients.companyName,
          isActive: clients.isActive,
        })
        .from(clients)
        .where(eq(clients.id, session.user.id))
        .limit(1)
      
      if (client[0]) {
        return {
          id: client[0].id,
          email: client[0].email,
          companyName: client[0].companyName,
          role: 'client',
          userType: 'client',
          isActive: client[0].isActive,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Non authentifié')
  }
  
  if (!user.isActive) {
    throw new Error('Compte désactivé')
  }
  
  return user
}

export async function requireRole(allowedRoles: string | string[]): Promise<AuthUser> {
  const user = await requireAuth()
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(user.role)) {
    throw new Error('Permissions insuffisantes')
  }
  
  return user
}

export async function requireEmployee(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.userType !== 'employee') {
    throw new Error('Accès réservé aux employés')
  }
  
  return user
}

export async function requireClient(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.userType !== 'client') {
    throw new Error('Accès réservé aux clients')
  }
  
  return user
}