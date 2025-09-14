// Types utilitaires pour la base de données
import type { 
  Employee, 
  NewEmployee, 
  Client, 
  NewClient, 
  Department, 
  NewDepartment,
  Position,
  NewPosition,
  Contract,
  NewContract,
  Leave,
  NewLeave,
  Project,
  NewProject,
  Workspace,
  NewWorkspace,
  Message,
  NewMessage
} from './schema'

// Types pour les operations de base de données
export interface DatabaseOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// Types pour les requêtes avec pagination
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Types pour les filtres de recherche
export interface BaseSearchFilters {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EmployeeSearchFilters extends BaseSearchFilters {
  departmentId?: string
  positionId?: string
  status?: Employee['status']
  managerId?: string
  isActive?: boolean
}

export interface ClientSearchFilters extends BaseSearchFilters {
  isActive?: boolean
  hasProjects?: boolean
}

export interface ProjectSearchFilters extends BaseSearchFilters {
  clientId?: string
  departmentId?: string
  managerId?: string
  status?: Project['status']
}

// Types pour les relations avec données complètes
export interface EmployeeWithRelations extends Employee {
  department?: Department | null
  position?: Position | null
  manager?: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  subordinates?: Pick<Employee, 'id' | 'firstName' | 'lastName'>[]
  contracts?: Contract[]
  leaves?: Leave[]
}

export interface ClientWithRelations extends Client {
  projects?: Project[]
  createdByEmployee?: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
}

export interface ProjectWithRelations extends Project {
  client?: Client | null
  department?: Department | null
  manager?: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  workspaces?: Workspace[]
}

// Types pour les données d'entrée validées
export interface CreateEmployeeData extends Omit<NewEmployee, 'id' | 'employeeNumber' | 'createdAt' | 'updatedAt'> {
  // Champs obligatoires
  firstName: string
  lastName: string
  email: string
  departmentId: string
  hireDate: Date
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id: string
  updatedBy?: string
}

export interface CreateClientData extends Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'> {
  // Champs obligatoires
  companyName: string
  contactEmail: string
  contactPerson: string
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string
}

export interface CreateProjectData extends Omit<NewProject, 'id' | 'createdAt' | 'updatedAt'> {
  // Champs obligatoires
  name: string
  clientId?: string
  departmentId?: string
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string
}

// Types pour les validations
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Types pour les permissions et accès
export interface AccessContext {
  userId: string
  userType: 'employee' | 'client'
  role?: string
  departmentId?: string
}

// Types pour les transactions
export interface TransactionOptions {
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable'
  timeout?: number
}

// Utilitaires de type pour garantir que les IDs sont des UUIDs
export type UUID = string & { readonly __brand: unique symbol }

export function isValidUUID(id: string): id is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function assertValidUUID(id: string): asserts id is UUID {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format: ${id}`)
  }
}

// Types pour les attributs JSON
export interface AddressData {
  street: string
  city: string
  postalCode: string
  country: string
  state?: string
  latitude?: number
  longitude?: number
}

export interface EmergencyContactData {
  name: string
  relationship: string
  phone: string
  email?: string
  address?: AddressData
}

export interface ProjectSettingsData {
  allowClientAccess: boolean
  requireApproval: boolean
  notifications: {
    email: boolean
    push: boolean
    slack?: string
  }
  billing?: {
    hourlyRate: number
    currency: string
    invoiceFrequency: 'weekly' | 'monthly' | 'quarterly'
  }
}

// Types pour les messages et pièces jointes
export interface MessageAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export interface MessageData {
  content: string
  type: 'text' | 'file' | 'image' | 'audio' | 'video'
  attachments?: MessageAttachment[]
  metadata?: Record<string, any>
}

// Export de tous les types du schéma pour faciliter l'importation
export type {
  Employee,
  NewEmployee,
  Client,
  NewClient,
  Department,
  NewDepartment,
  Position,
  NewPosition,
  Contract,
  NewContract,
  Leave,
  NewLeave,
  Project,
  NewProject,
  Workspace,
  NewWorkspace,
  Message,
  NewMessage
}