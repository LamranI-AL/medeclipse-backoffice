'use server'

import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db/neon"
import { employees, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export async function login(formData: FormData) {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
    
    const validatedData = loginSchema.parse(data)
    
    // Chercher l'utilisateur dans les employés
    const employee = await db
      .select({
        id: employees.id,
        email: employees.email,
        firstName: employees.firstName,
        lastName: employees.lastName,
        passwordHash: employees.passwordHash,
        role: employees.role,
        departmentId: employees.departmentId,
        isActive: employees.isActive,
      })
      .from(employees)
      .where(eq(employees.email, validatedData.email))
      .limit(1)
    
    if (employee[0] && employee[0].passwordHash) {
      const isValidPassword = await bcrypt.compare(validatedData.password, employee[0].passwordHash)
      
      if (isValidPassword && employee[0].isActive) {
        // Créer la session avec Better Auth
        const session = await auth.api.signInEmail({
          body: {
            email: validatedData.email,
            password: validatedData.password
          }
        })
        
        // Mettre à jour la dernière connexion
        await db
          .update(employees)
          .set({ lastLogin: new Date() })
          .where(eq(employees.id, employee[0].id))
        
        return {
          success: true,
          user: {
            id: employee[0].id,
            email: employee[0].email,
            name: `${employee[0].firstName} ${employee[0].lastName}`,
            role: employee[0].role,
            userType: 'employee' as const,
            departmentId: employee[0].departmentId
          }
        }
      }
    }
    
    // Chercher dans les clients si pas trouvé dans les employés
    const client = await db
      .select({
        id: clients.id,
        email: clients.contactEmail,
        companyName: clients.companyName,
        passwordHash: clients.passwordHash,
        isActive: clients.isActive,
      })
      .from(clients)
      .where(eq(clients.contactEmail, validatedData.email))
      .limit(1)
    
    if (client[0] && client[0].passwordHash) {
      const isValidPassword = await bcrypt.compare(validatedData.password, client[0].passwordHash)
      
      if (isValidPassword && client[0].isActive) {
        // Mettre à jour la dernière connexion
        await db
          .update(clients)
          .set({ lastLogin: new Date() })
          .where(eq(clients.id, client[0].id))
        
        return {
          success: true,
          user: {
            id: client[0].id,
            email: client[0].email,
            name: client[0].companyName,
            role: 'client' as const,
            userType: 'client' as const
          }
        }
      }
    }
    
    return {
      success: false,
      error: "Email ou mot de passe incorrect"
    }
    
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la connexion"
    }
  }
}

export async function loginAndRedirect(formData: FormData) {
  const result = await login(formData)
  
  if (result.success && result.user) {
    // Redirection selon le rôle
    switch (result.user.role) {
      case 'super_admin':
      case 'admin':
        redirect('/dashboard/admin')
      case 'dept_manager':
        redirect('/dashboard/manager')
      case 'employee':
        redirect('/dashboard/employee')
      case 'client':
        redirect('/dashboard/client')
      default:
        redirect('/dashboard')
    }
  }
  
  return result
}