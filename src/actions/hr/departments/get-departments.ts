'use server'

import { db } from '@/lib/db/neon'
import { departments, employees } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function getDepartments() {
  try {
    // Récupérer tous les départements avec le nombre d'employés
    const departmentsList = await db
      .select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        // managerId: departments.managerId,
        // location: departments.location,
        // budget: departments.budget,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        employeeCount: count(employees.id),
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .groupBy(departments.id, departments.name, departments.description, 
              //  departments.managerId, departments.location, departments.budget,
               departments.createdAt, departments.updatedAt)

    // Récupérer les informations des managers
    const departmentsWithManagers = await Promise.all(
      departmentsList.map(async (dept : any) => {
        let managerName = null
        if (dept.managerId) {
          const manager = await db
            .select({ firstName: employees.firstName, lastName: employees.lastName })
            .from(employees)
            .where(eq(employees.id, dept.managerId))
            .limit(1)

          if (manager[0]) {
            managerName = `${manager[0].firstName} ${manager[0].lastName}`
          }
        }

        return {
          ...dept,
          manager: managerName,
        }
      })
    )

    return {
      success: true,
      data: departmentsWithManagers
    }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des départements',
      data: []
    }
  }
}

export async function getDepartmentById(id: string) {
  try {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1)

    if (!department) {
      return {
        success: false,
        error: 'Département non trouvé'
      }
    }

    // Récupérer le nombre d'employés
    const [employeeCount] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.departmentId, id))

    // Récupérer le manager si défini
    let managerName = null
    if (department.managerId) {
      const [manager] = await db
        .select({ firstName: employees.firstName, lastName: employees.lastName })
        .from(employees)
        .where(eq(employees.id, department.managerId))
        .limit(1)

      if (manager) {
        managerName = `${manager.firstName} ${manager.lastName}`
      }
    }

    return {
      success: true,
      data: {
        ...department,
        manager: managerName,
        employeeCount: employeeCount.count,
      }
    }
  } catch (error) {
    console.error('Error fetching department:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération du département'
    }
  }
}