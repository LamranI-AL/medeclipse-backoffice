// API Routes pour un employé spécifique
import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeById } from '@/lib/db/queries/employees'
import { db } from '@/lib/db/neon'
import { employees } from '@/lib/db/schema'
import { updateEmployeeSchema } from '@/lib/validations/employee-schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

type Params = {
  id: string
}

// GET /api/v1/hr/employees/[id] - Obtenir un employé par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID employé requis',
          code: 'MISSING_EMPLOYEE_ID'
        },
        { status: 400 }
      )
    }

    const employee = await getEmployeeById(id)

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employé introuvable',
          code: 'EMPLOYEE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error(`GET /api/v1/hr/employees/${params.id} error:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération de l\'employé',
        code: 'FETCH_EMPLOYEE_ERROR'
      },
      { status: 500 }
    )
  }
}

// PUT /api/v1/hr/employees/[id] - Mettre à jour un employé
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID employé requis',
          code: 'MISSING_EMPLOYEE_ID'
        },
        { status: 400 }
      )
    }

    // Vérifier que l'employé existe
    const existingEmployee = await getEmployeeById(id)
    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employé introuvable',
          code: 'EMPLOYEE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Validation des données avec Zod
    const validatedData = updateEmployeeSchema.parse({ ...body, id })

    // Préparer les données à mettre à jour (exclure l'ID)
    const { id: _, ...updateData } = validatedData

    // Mettre à jour l'employé
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning()

    // Récupérer l'employé complet avec les relations
    const completeEmployee = await getEmployeeById(id)

    return NextResponse.json({
      success: true,
      data: completeEmployee,
      message: 'Employé mis à jour avec succès',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error(`PUT /api/v1/hr/employees/${params.id} error:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour de l\'employé',
        code: 'UPDATE_EMPLOYEE_ERROR'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/hr/employees/[id] - Supprimer un employé
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID employé requis',
          code: 'MISSING_EMPLOYEE_ID'
        },
        { status: 400 }
      )
    }

    // Vérifier que l'employé existe
    const existingEmployee = await getEmployeeById(id)
    if (!existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employé introuvable',
          code: 'EMPLOYEE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Soft delete : marquer comme terminé au lieu de supprimer
    const [deletedEmployee] = await db
      .update(employees)
      .set({
        status: 'terminated',
        terminationDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
        status: employees.status,
      })

    return NextResponse.json({
      success: true,
      data: deletedEmployee,
      message: 'Employé marqué comme terminé avec succès',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error(`DELETE /api/v1/hr/employees/${params.id} error:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression de l\'employé',
        code: 'DELETE_EMPLOYEE_ERROR'
      },
      { status: 500 }
    )
  }
}