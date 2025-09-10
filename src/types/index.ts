export interface ActionResult {
  success: boolean
  error?: string
  data?: any
}

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date
  street: string
  city: string
  postalCode: string
  country: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  emergencyContactEmail?: string
  departmentId: string
  positionId: string
  managerId?: string
  hireDate: Date
  status: 'active' | 'inactive' | 'terminated'
  medicalLicenseNumber?: string
  licenseExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Position {
  id: string
  title: string
  description?: string
  departmentId: string
  baseSalary?: number
  createdAt: Date
  updatedAt: Date
}