'use server'

import { db } from '@/lib/db/neon'
import { positions, departments, employees } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function getPositions() {
  try {
    // Récupérer toutes les positions avec le département et le nombre d'employés
    const positionsList = await db
      .select({
        id: positions.id,
        title: positions.title,
        description: positions.description,
        departmentId: positions.departmentId,
        level: positions.level,
        baseSalary: positions.baseSalary,
        requirements: positions.requirements,
        responsibilities: positions.responsibilities,
        createdAt: positions.createdAt,
        updatedAt: positions.updatedAt,
        departmentName: departments.name,
        employeeCount: count(employees.id),
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .leftJoin(employees, eq(positions.id, employees.positionId))
      .groupBy(
        positions.id, positions.title, positions.description, positions.departmentId,
        positions.level, positions.baseSalary, positions.requirements, positions.responsibilities,
        positions.createdAt, positions.updatedAt, departments.name
      )

    const formattedPositions = positionsList.map(pos => ({
      ...pos,
      department: pos.departmentName,
    }))

    return {
      success: true,
      data: formattedPositions
    }
  } catch (error) {
    console.error('Error fetching positions:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des postes',
      data: []
    }
  }
}

export async function getPositionById(id: string) {
  try {
    const [position] = await db
      .select({
        id: positions.id,
        title: positions.title,
        description: positions.description,
        departmentId: positions.departmentId,
        level: positions.level,
        baseSalary: positions.baseSalary,
        requirements: positions.requirements,
        responsibilities: positions.responsibilities,
        createdAt: positions.createdAt,
        updatedAt: positions.updatedAt,
        departmentName: departments.name,
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .where(eq(positions.id, id))
      .limit(1)

    if (!position) {
      return {
        success: false,
        error: 'Poste non trouvé'
      }
    }

    // Récupérer le nombre d'employés pour ce poste
    const [employeeCount] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.positionId, id))

    return {
      success: true,
      data: {
        ...position,
        department: position.departmentName,
        employeeCount: employeeCount.count,
      }
    }
  } catch (error) {
    console.error('Error fetching position:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération du poste'
    }
  }
}

export async function getPositionsByDepartment(departmentId: string) {
  try {
    const positionsList = await db
      .select()
      .from(positions)
      .where(eq(positions.departmentId, departmentId))

    return {
      success: true,
      data: positionsList
    }
  } catch (error) {
    console.error('Error fetching positions by department:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des postes',
      data: []
    }
  }
}