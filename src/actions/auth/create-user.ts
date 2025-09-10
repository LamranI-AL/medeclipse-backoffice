'use server'

import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db/neon"
import { employees, clients } from "@/lib/db/schema"
import { requireRole } from "./session"
import { eq } from "drizzle-orm"

const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(['employee', 'dept_manager', 'admin']),
  departmentId: z.string().min(1, "Département requis"),
  positionId: z.string().optional(),
})

const createClientSchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  contactEmail: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe doit contenir au moins 8 caractères"),
  contactPerson: z.string().min(2, "Personne de contact requise"),
  contactPhone: z.string().optional(),
})

export async function createEmployee(formData: FormData) {
  try {
    // Vérifier les permissions
    const currentUser = await requireRole(['super_admin', 'admin'])
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'employee' | 'dept_manager' | 'admin',
      departmentId: formData.get('departmentId') as string,
      positionId: formData.get('positionId') as string || undefined,
    }
    
    const validatedData = createEmployeeSchema.parse(data)
    
    // Vérifier si l'email existe déjà
    const existingEmployee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.email, validatedData.email))
      .limit(1)
    
    if (existingEmployee[0]) {
      return {
        success: false,
        error: "Un employé avec cet email existe déjà"
      }
    }
    
    // Hacher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 12)
    
    // Générer le numéro d'employé
    const employeeNumber = `EMP${Date.now()}`
    
    // Créer l'employé
    const [newEmployee] = await db
      .insert(employees)
      .values({
        employeeNumber,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        departmentId: validatedData.departmentId,
        positionId: validatedData.positionId,
        hireDate: new Date(),
        isActive: true,
        emailVerified: true,
        createdBy: currentUser.id,
      })
      .returning({ id: employees.id })
    
    return {
      success: true,
      data: newEmployee
    }
    
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la création de l'employé"
    }
  }
}

export async function createClient(formData: FormData) {
  try {
    // Vérifier les permissions
    const currentUser = await requireRole(['super_admin', 'admin'])
    
    const data = {
      companyName: formData.get('companyName') as string,
      contactEmail: formData.get('contactEmail') as string,
      password: formData.get('password') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
    }
    
    const validatedData = createClientSchema.parse(data)
    
    // Vérifier si l'email existe déjà
    const existingClient = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.contactEmail, validatedData.contactEmail))
      .limit(1)
    
    if (existingClient[0]) {
      return {
        success: false,
        error: "Un client avec cet email existe déjà"
      }
    }
    
    // Hacher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 12)
    
    // Créer le client
    const [newClient] = await db
      .insert(clients)
      .values({
        companyName: validatedData.companyName,
        contactEmail: validatedData.contactEmail,
        passwordHash,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone,
        isActive: true,
        emailVerified: true,
        createdBy: currentUser.id,
      })
      .returning({ id: clients.id })
    
    return {
      success: true,
      data: newClient
    }
    
  } catch (error) {
    console.error('Error creating client:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de la création du client"
    }
  }
}

export async function changePassword(formData: FormData) {
  try {
    const currentUser = await requireRole(['super_admin', 'admin', 'dept_manager', 'employee', 'client'])
    
    const data = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }
    
    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        error: "Les mots de passe ne correspondent pas"
      }
    }
    
    if (data.newPassword.length < 8) {
      return {
        success: false,
        error: "Le mot de passe doit contenir au moins 8 caractères"
      }
    }
    
    // Vérifier le mot de passe actuel
    if (currentUser.userType === 'employee') {
      const employee = await db
        .select({ passwordHash: employees.passwordHash })
        .from(employees)
        .where(eq(employees.id, currentUser.id))
        .limit(1)
      
      if (!employee[0] || !employee[0].passwordHash) {
        return { success: false, error: "Utilisateur non trouvé" }
      }
      
      const isValid = await bcrypt.compare(data.currentPassword, employee[0].passwordHash)
      if (!isValid) {
        return { success: false, error: "Mot de passe actuel incorrect" }
      }
      
      // Mettre à jour le mot de passe
      const newPasswordHash = await bcrypt.hash(data.newPassword, 12)
      await db
        .update(employees)
        .set({ 
          passwordHash: newPasswordHash,
          updatedBy: currentUser.id 
        })
        .where(eq(employees.id, currentUser.id))
    }
    
    if (currentUser.userType === 'client') {
      const client = await db
        .select({ passwordHash: clients.passwordHash })
        .from(clients)
        .where(eq(clients.id, currentUser.id))
        .limit(1)
      
      if (!client[0] || !client[0].passwordHash) {
        return { success: false, error: "Utilisateur non trouvé" }
      }
      
      const isValid = await bcrypt.compare(data.currentPassword, client[0].passwordHash)
      if (!isValid) {
        return { success: false, error: "Mot de passe actuel incorrect" }
      }
      
      // Mettre à jour le mot de passe
      const newPasswordHash = await bcrypt.hash(data.newPassword, 12)
      await db
        .update(clients)
        .set({ passwordHash: newPasswordHash })
        .where(eq(clients.id, currentUser.id))
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error changing password:', error)
    return {
      success: false,
      error: "Erreur lors du changement de mot de passe"
    }
  }
}