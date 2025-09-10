// API Routes pour les postes
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/neon'
import { positions, departments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Schéma de validation pour créer un poste
const createPositionSchema = z.object({
  title: z.string().min(1).max(150),
  code: z.string().min(1).max(20),
  departmentId: z.string().uuid(),
  description: z.string().optional(),
  isManager: z.boolean().default(false),
  isMedical: z.boolean().default(false),
})

// GET /api/v1/hr/positions - Lister tous les postes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')

    let query = db
      .select({
        id: positions.id,
        title: positions.title,
        code: positions.code,
        description: positions.description,
        isManager: positions.isManager,
        isMedical: positions.isMedical,
        createdAt: positions.createdAt,
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code,
        },
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .orderBy(positions.title)

    // Filtrer par département si spécifié
    if (departmentId) {
      query = query.where(eq(positions.departmentId, departmentId))
    }

    const positionsList = await query

    return NextResponse.json({
      success: true,
      data: positionsList,
      meta: {
        total: positionsList.length,
        filters: { departmentId },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error('GET /api/v1/hr/positions error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des postes',
        code: 'FETCH_POSITIONS_ERROR'
      },
      { status: 500 }
    )
  }
}

// POST /api/v1/hr/positions - Créer un poste
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = createPositionSchema.parse(body)

    // Vérifier si le code existe déjà
    const [existingPosition] = await db
      .select({ id: positions.id })
      .from(positions)
      .where(eq(positions.code, validatedData.code))

    if (existingPosition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un poste avec ce code existe déjà',
          code: 'POSITION_CODE_EXISTS'
        },
        { status: 409 }
      )
    }

    // Vérifier que le département existe
    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, validatedData.departmentId))

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: 'Département introuvable',
          code: 'DEPARTMENT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Créer le poste
    const [newPosition] = await db
      .insert(positions)
      .values(validatedData)
      .returning()

    // Récupérer le poste complet avec le département
    const [completePosition] = await db
      .select({
        id: positions.id,
        title: positions.title,
        code: positions.code,
        description: positions.description,
        isManager: positions.isManager,
        isMedical: positions.isMedical,
        createdAt: positions.createdAt,
        department: {
          id: departments.id,
          name: departments.name,
          code: departments.code,
        },
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .where(eq(positions.id, newPosition.id))

    return NextResponse.json(
      {
        success: true,
        data: completePosition,
        message: 'Poste créé avec succès',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/v1/hr/positions error:', error)
    
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
        error: 'Erreur lors de la création du poste',
        code: 'CREATE_POSITION_ERROR'
      },
      { status: 500 }
    )
  }
}