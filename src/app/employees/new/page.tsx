'use client'

import { EmployeeForm } from '@/components/forms/employee-form'
import { useRouter } from 'next/navigation'

export default function NewEmployeePage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Rediriger vers la liste des employés après création
    router.push('/employees')
  }

  const handleCancel = () => {
    // Retourner à la liste des employés
    router.back()
  }

  return (
    <div className="container mx-auto p-6">
      <EmployeeForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}