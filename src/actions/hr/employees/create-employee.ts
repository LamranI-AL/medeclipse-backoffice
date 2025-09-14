'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db, withTransaction } from '@/lib/db/neon'
import { employees, departments } from '@/lib/db/schema'
import { createEmployeeSchema } from '@/lib/validations/employee-schema'
import { checkEmailExists, getNextEmployeeNumber } from '@/lib/db/queries/employees'
import { eq } from 'drizzle-orm'
import type { DatabaseOperationResult, CreateEmployeeData } from '@/lib/db/types'

// Type pour le résultat de l'action
type ActionResult = DatabaseOperationResult<{ employeeId: string }>

export async function createEmployee(formData: FormData): Promise<ActionResult> {
  try {
    // Extraire et valider les données du formulaire
    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      dateOfBirth: formData.get('dateOfBirth'),
      address: {
        street: formData.get('street'),
        city: formData.get('city'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country') || 'FR',
      },
      emergencyContact: {
        name: formData.get('emergencyContactName'),
        relationship: formData.get('emergencyContactRelationship'),
        phone: formData.get('emergencyContactPhone'),
        email: formData.get('emergencyContactEmail') || undefined,
      },
      departmentId: formData.get('departmentId'),
      positionId: formData.get('positionId'),
      managerId: formData.get('managerId') || undefined,
      hireDate: formData.get('hireDate'),
      medicalLicenseNumber: formData.get('medicalLicenseNumber') || undefined,
      licenseExpiry: formData.get('licenseExpiry') || undefined,
    }

    // Validation avec Zod
    const validatedData = createEmployeeSchema.parse(rawData)

    // Vérifier si l'email existe déjà
    const emailExists = await checkEmailExists(validatedData.email)
    if (emailExists) {
      return {
        success: false,
        error: 'Un employé avec cet email existe déjà',
      }
    }

    // Obtenir le code du département pour générer le numéro d'employé
    const [department] = await db
      .select({ code: departments.code })
      .from(departments)
      .where(eq(departments.id, validatedData.departmentId))

    if (!department) {
      return {
        success: false,
        error: 'Département introuvable',
      }
    }

    // Générer le numéro d'employé
    const employeeNumber = await getNextEmployeeNumber(department.code)

    // Créer l'employé dans une transaction
    const result = await withTransaction(async (tx) => {
      const [newEmployee] = await tx
        .insert(employees)
        .values({
          employeeNumber,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth,
          address: validatedData.address,
          emergencyContact: validatedData.emergencyContact,
          departmentId: validatedData.departmentId,
          positionId: validatedData.positionId,
          managerId: validatedData.managerId,
          hireDate: validatedData.hireDate,
          medicalLicenseNumber: validatedData.medicalLicenseNumber,
          licenseExpiry: validatedData.licenseExpiry,
          status: 'active',
          isActive: true,
          emailVerified: false,
        })
        .returning({ id: employees.id })

      return newEmployee
    })

    // Revalider la page des employés pour actualiser la liste (seulement en contexte web)
    try {
      revalidatePath('/dashboard/hr/employees')
    } catch (error) {
      // Ignorer l'erreur si on n'est pas dans un contexte Next.js (ex: script de test)
      console.log('⚠️ revalidatePath non disponible (contexte script)')
    }

    return {
      success: true,
      data: { employeeId: result.id },
    }
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Données invalides: ' + error.errors.map(e => e.message).join(', '),
        code: 'VALIDATION_ERROR'
      }
    }

    // Gestion des erreurs de contraintes de base de données
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; detail?: string }
      
      switch (dbError.code) {
        case '23505': // Unique violation
          return {
            success: false,
            error: 'Un employé avec cet email existe déjà',
            code: 'DUPLICATE_EMAIL'
          }
        case '23503': // Foreign key violation
          return {
            success: false,
            error: 'Référence invalide (département ou poste)',
            code: 'FOREIGN_KEY_ERROR'
          }
      }
    }

    return {
      success: false,
      error: 'Erreur lors de la création de l\'employé',
      code: 'UNKNOWN_ERROR'
    }
  }
}

// Action pour créer un employé et rediriger
export async function createEmployeeAndRedirect(formData: FormData) {
  const result = await createEmployee(formData)
  
  if (result.success && result.data?.employeeId) {
    redirect(`/dashboard/hr/employees/${result.data.employeeId}`)
  }
  
  return result
}