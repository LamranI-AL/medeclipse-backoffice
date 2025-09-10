// API Routes pour les employés
import { NextRequest, NextResponse } from 'next/server'
import { getEmployees, getEmployeesCount } from '@/lib/db/queries/employees'
import { db } from '@/lib/db/neon'
import { employees, departments } from '@/lib/db/schema'
import { createEmployeeSchema } from '@/lib/validations/employee-schema'
import { checkEmailExists, getNextEmployeeNumber } from '@/lib/db/queries/employees'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/v1/hr/employees - Lister les employés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extraire les paramètres de requête
    const filters = {
      search: searchParams.get('search') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      positionId: searchParams.get('positionId') || undefined,
      status: searchParams.get('status') as any || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100
    }

    // Obtenir les employés et le total
    const [employeesList, totalCount] = await Promise.all([
      getEmployees(filters),
      getEmployeesCount(filters)
    ])

    const totalPages = Math.ceil(totalCount / filters.limit)

    return NextResponse.json({
      success: true,
      data: employeesList,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrevious: filters.page > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    })

  } catch (error) {
    console.error('GET /api/v1/hr/employees error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des employés',
        code: 'FETCH_EMPLOYEES_ERROR'
      },
      { status: 500 }
    )
  }
}

// POST /api/v1/hr/employees - Créer un employé
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données avec Zod
    const validatedData = createEmployeeSchema.parse(body)

    // Vérifier si l'email existe déjà
    const emailExists = await checkEmailExists(validatedData.email)
    if (emailExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un employé avec cet email existe déjà',
          code: 'EMAIL_ALREADY_EXISTS'
        },
        { status: 409 }
      )
    }

    // Obtenir le code du département pour générer le numéro d'employé
    const [department] = await db
      .select({ code: departments.code })
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

    // Générer le numéro d'employé
    const employeeNumber = await getNextEmployeeNumber(department.code)

    // Créer l'employé dans la base de données
    const [newEmployee] = await db
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
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        data: newEmployee,
        message: 'Employé créé avec succès',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('POST /api/v1/hr/employees error:', error)
    
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
        error: 'Erreur lors de la création de l\'employé',
        code: 'CREATE_EMPLOYEE_ERROR'
      },
      { status: 500 }
    )
  }
}