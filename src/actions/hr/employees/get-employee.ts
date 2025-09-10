'use server'

import { getEmployeeById } from '@/lib/db/queries/employees'
import { notFound } from 'next/navigation'

export async function getEmployee(id: string) {
  try {
    if (!id) {
      throw new Error('ID employé requis')
    }

    const employee = await getEmployeeById(id)
    
    if (!employee) {
      notFound()
    }

    return employee
  } catch (error) {
    console.error('Error fetching employee:', error)
    
    if (error instanceof Error && error.message.includes('ID employé requis')) {
      throw error
    }
    
    throw new Error('Erreur lors de la récupération de l\'employé')
  }
}