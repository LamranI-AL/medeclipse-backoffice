'use client'

import { DepartmentForm } from '@/components/forms/department-form'
import { useRouter } from 'next/navigation'

export default function NewDepartmentPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Rediriger vers la liste des départements après création
    router.push('/departments')
  }

  const handleCancel = () => {
    // Retourner à la liste des départements
    router.back()
  }

  return (
    <div className="container mx-auto p-6">
      <DepartmentForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}