// Requêtes réutilisables pour les employés
import { db } from '../neon'
import { employees, departments, positions } from '../schema'
import { eq, and, like, desc, asc, count, sql } from 'drizzle-orm'
import type { SearchEmployeesInput } from '../../validations/employee-schema'

// Obtenir tous les employés avec relations
export async function getEmployees(filters: SearchEmployeesInput = { page: 1, limit: 20 }) {
  const { search, departmentId, positionId, status, page = 1, limit = 20 } = filters
  
  let query = db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      status: employees.status,
      hireDate: employees.hireDate,
      department: {
        id: departments.id,
        name: departments.name,
        code: departments.code,
      },
      position: {
        id: positions.id,
        title: positions.title,
      },
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .orderBy(desc(employees.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  // Filtres conditionnels
  const conditions = []
  
  if (search) {
    conditions.push(
      sql`${employees.firstName} ILIKE ${`%${search}%`} OR 
          ${employees.lastName} ILIKE ${`%${search}%`} OR 
          ${employees.email} ILIKE ${`%${search}%`} OR 
          ${employees.employeeNumber} ILIKE ${`%${search}%`}`
    )
  }
  
  if (departmentId) {
    conditions.push(eq(employees.departmentId, departmentId))
  }
  
  if (positionId) {
    conditions.push(eq(employees.positionId, positionId))
  }
  
  if (status) {
    conditions.push(eq(employees.status, status))
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  return await query
}

// Obtenir un employé par ID avec toutes les relations
export async function getEmployeeById(id: string) {
  const [employee] = await db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      dateOfBirth: employees.dateOfBirth,
      address: employees.address,
      emergencyContact: employees.emergencyContact,
      hireDate: employees.hireDate,
      terminationDate: employees.terminationDate,
      status: employees.status,
      medicalLicenseNumber: employees.medicalLicenseNumber,
      licenseExpiry: employees.licenseExpiry,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
      department: {
        id: departments.id,
        name: departments.name,
        code: departments.code,
      },
      position: {
        id: positions.id,
        title: positions.title,
      },
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.id, id))

  return employee
}

// Obtenir le nombre total d'employés (pour pagination)
export async function getEmployeesCount(filters: Omit<SearchEmployeesInput, 'page' | 'limit'> = {}) {
  const { search, departmentId, positionId, status } = filters
  
  let query = db
    .select({ count: count() })
    .from(employees)

  // Appliquer les mêmes filtres que pour getEmployees
  const conditions = []
  
  if (search) {
    conditions.push(
      sql`${employees.firstName} ILIKE ${`%${search}%`} OR 
          ${employees.lastName} ILIKE ${`%${search}%`} OR 
          ${employees.email} ILIKE ${`%${search}%`} OR 
          ${employees.employeeNumber} ILIKE ${`%${search}%`}`
    )
  }
  
  if (departmentId) {
    conditions.push(eq(employees.departmentId, departmentId))
  }
  
  if (positionId) {
    conditions.push(eq(employees.positionId, positionId))
  }
  
  if (status) {
    conditions.push(eq(employees.status, status))
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  const [result] = await query
  return result.count
}

// Vérifier si un email existe déjà
export async function checkEmailExists(email: string, excludeId?: string) {
  let query = db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, email))

  if (excludeId) {
    query = query.where(and(eq(employees.email, email), sql`${employees.id} != ${excludeId}`))
  }

  const [existing] = await query
  return !!existing
}

// Obtenir le prochain numéro d'employé
export async function getNextEmployeeNumber(departmentCode: string) {
  const year = new Date().getFullYear()
  const prefix = `${departmentCode}${year}`
  
  const [lastEmployee] = await db
    .select({ employeeNumber: employees.employeeNumber })
    .from(employees)
    .where(like(employees.employeeNumber, `${prefix}%`))
    .orderBy(desc(employees.employeeNumber))
    .limit(1)

  if (!lastEmployee) {
    return `${prefix}0001`
  }

  const lastNumber = parseInt(lastEmployee.employeeNumber.slice(-4))
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
  
  return `${prefix}${nextNumber}`
}

// Obtenir les managers disponibles
export async function getAvailableManagers(departmentId?: string) {
  let query = db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      position: {
        title: positions.title,
      },
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(
      and(
        eq(employees.status, 'active'),
        eq(positions.isManager, true)
      )
    )
    .orderBy(asc(employees.lastName))

  if (departmentId) {
    query = query.where(
      and(
        eq(employees.status, 'active'),
        eq(positions.isManager, true),
        eq(employees.departmentId, departmentId)
      )
    )
  }

  return await query
}