'use server'

import { getEmployees, getEmployeesCount } from '@/lib/db/queries/employees'
import { searchEmployeesSchema, type SearchEmployeesInput } from '@/lib/validations/employee-schema'

// Type pour le résultat paginé
type PaginatedResult<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export async function getEmployeesList(searchParams: SearchEmployeesInput = {}) {
  try {
    // Valider les paramètres de recherche
    const validatedParams = searchEmployeesSchema.parse(searchParams)
    
    // Obtenir les employés et le total
    const [employeesList, totalCount] = await Promise.all([
      getEmployees(validatedParams),
      getEmployeesCount(validatedParams)
    ])

    const totalPages = Math.ceil(totalCount / validatedParams.limit)
    
    const result: PaginatedResult<typeof employeesList[0]> = {
      data: employeesList,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: totalCount,
        totalPages,
        hasNext: validatedParams.page < totalPages,
        hasPrevious: validatedParams.page > 1,
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw new Error('Erreur lors de la récupération des employés')
  }
}

// Action pour obtenir les statistiques des employés
export async function getEmployeesStats() {
  try {
    // Obtenir les totaux par statut
    const [activeCount, onLeaveCount, totalCount] = await Promise.all([
      getEmployeesCount({ status: 'active' }),
      getEmployeesCount({ status: 'on_leave' }),
      getEmployeesCount({})
    ])

    return {
      total: totalCount,
      active: activeCount,
      onLeave: onLeaveCount,
      inactive: totalCount - activeCount,
    }
  } catch (error) {
    console.error('Error fetching employee stats:', error)
    throw new Error('Erreur lors de la récupération des statistiques')
  }
}