// API Routes pour les départements
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/neon'
import { departments, positions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

// Schéma de validation pour créer un département
const createDepartmentSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

// GET /api/v1/hr/departments - Lister tous les départements
export async function GET(request: NextRequest) {
  try {
    const departmentsList = await db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        description: departments.description,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .orderBy(departments.name)

    return NextResponse.json({
      success: true,
      data: departmentsList,
      meta: {
        total: departmentsList.length,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error('GET /api/v1/hr/departments error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des départements',
        code: 'FETCH_DEPARTMENTS_ERROR'
      },
      { status: 500 }
    )
  }
}

// POST /api/v1/hr/departments - Créer un département
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = createDepartmentSchema.parse(body)

    // Vérifier si le code existe déjà
    const [existingDept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.code, validatedData.code))

    if (existingDept) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un département avec ce code existe déjà',
          code: 'DEPARTMENT_CODE_EXISTS'
        },
        { status: 409 }
      )
    }

    // Créer le département
    const [newDepartment] = await db
      .insert(departments)
      .values(validatedData)
      .returning()

    return NextResponse.json(
      {
        success: true,
        data: newDepartment,
        message: 'Département créé avec succès',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/v1/hr/departments error:', error)
    
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
        error: 'Erreur lors de la création du département',
        code: 'CREATE_DEPARTMENT_ERROR'
      },
      { status: 500 }
    )
  }
}