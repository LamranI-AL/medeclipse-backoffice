// Helpers pour les opérations de base de données
import { z } from 'zod'
import type { DatabaseOperationResult, ValidationResult, ValidationError } from './types'

// Helper pour valider les données avec Zod
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult & { data?: T } {
  try {
    const validatedData = schema.parse(data)
    return {
      valid: true,
      errors: [],
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      return {
        valid: false,
        errors
      }
    }
    
    return {
      valid: false,
      errors: [{
        field: 'unknown',
        message: 'Erreur de validation inconnue',
        code: 'UNKNOWN_ERROR'
      }]
    }
  }
}

// Helper pour créer des résultats d'opération standardisés
export function createSuccessResult<T>(data?: T): DatabaseOperationResult<T> {
  return {
    success: true,
    data
  }
}

export function createErrorResult(
  error: string, 
  code?: string
): DatabaseOperationResult<never> {
  return {
    success: false,
    error,
    code
  }
}

// Helper pour gérer les erreurs de base de données PostgreSQL
export function handleDatabaseError(error: unknown): DatabaseOperationResult<never> {
  console.error('Database error:', error)
  
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; detail?: string; constraint?: string }
    
    switch (dbError.code) {
      case '23505': // Unique violation
        const field = dbError.constraint?.includes('email') ? 'email' : 'identifiant'
        return createErrorResult(
          `Un enregistrement avec ce ${field} existe déjà`,
          'DUPLICATE_KEY'
        )
        
      case '23503': // Foreign key violation
        return createErrorResult(
          'Référence invalide - l\'élément référencé n\'existe pas',
          'FOREIGN_KEY_ERROR'
        )
        
      case '23514': // Check constraint violation
        return createErrorResult(
          'Données invalides - contrainte de validation non respectée',
          'CHECK_CONSTRAINT_ERROR'
        )
        
      case '23502': // Not null violation
        return createErrorResult(
          'Champ obligatoire manquant',
          'NOT_NULL_ERROR'
        )
        
      case '22001': // String data too long
        return createErrorResult(
          'Données trop longues pour le champ',
          'STRING_TOO_LONG'
        )
        
      case '22P02': // Invalid input syntax
        return createErrorResult(
          'Format de données invalide',
          'INVALID_INPUT_SYNTAX'
        )
        
      case '25P02': // Transaction aborted
        return createErrorResult(
          'Transaction annulée - veuillez réessayer',
          'TRANSACTION_ABORTED'
        )
        
      case '53300': // Too many connections
        return createErrorResult(
          'Trop de connexions actives - veuillez réessayer plus tard',
          'TOO_MANY_CONNECTIONS'
        )
        
      case '57014': // Query canceled
        return createErrorResult(
          'Opération annulée - timeout ou interruption',
          'QUERY_CANCELED'
        )
        
      case '42P01': // Undefined table
        return createErrorResult(
          'Table non trouvée - problème de configuration',
          'UNDEFINED_TABLE'
        )
        
      default:
        return createErrorResult(
          `Erreur de base de données (${dbError.code})`,
          'UNKNOWN_DB_ERROR'
        )
    }
  }
  
  if (error instanceof z.ZodError) {
    const messages = error.errors.map(e => e.message).join(', ')
    return createErrorResult(
      `Données invalides: ${messages}`,
      'VALIDATION_ERROR'
    )
  }
  
  return createErrorResult(
    'Erreur interne du serveur',
    'INTERNAL_ERROR'
  )
}

// Helper pour extraire les données d'un FormData
export function extractFormData(formData: FormData): Record<string, any> {
  const data: Record<string, any> = {}
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      // Gestion des valeurs vides
      if (value.trim() === '') {
        data[key] = undefined
        continue
      }
      
      // Tentative de parsing JSON pour les objets
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          data[key] = JSON.parse(value)
          continue
        } catch {
          // Si ce n'est pas du JSON valide, traiter comme string
        }
      }
      
      // Gestion des dates (format ISO)
      if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
        data[key] = new Date(value)
        continue
      }
      
      // Gestion des booléens
      if (value === 'true' || value === 'false') {
        data[key] = value === 'true'
        continue
      }
      
      // Gestion des nombres
      if (!isNaN(Number(value)) && value.trim() !== '') {
        data[key] = Number(value)
        continue
      }
      
      data[key] = value
    } else {
      data[key] = value
    }
  }
  
  return data
}

// Helper pour construire des adresses JSON
export function buildAddressObject(data: Record<string, any>, prefix = ''): any {
  const keys = ['street', 'city', 'postalCode', 'country', 'state']
  const address: any = {}
  let hasValues = false
  
  for (const key of keys) {
    const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}` : key
    if (data[fullKey]) {
      address[key] = data[fullKey]
      hasValues = true
    }
  }
  
  return hasValues ? address : undefined
}

// Helper pour construire des contacts d'urgence JSON
export function buildEmergencyContactObject(data: Record<string, any>, prefix = 'emergencyContact'): any {
  const keys = ['name', 'relationship', 'phone', 'email']
  const contact: any = {}
  let hasValues = false
  
  for (const key of keys) {
    const fullKey = `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`
    if (data[fullKey]) {
      contact[key] = data[fullKey]
      hasValues = true
    }
  }
  
  return hasValues ? contact : undefined
}

// Helper pour vérifier les UUIDs
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper pour sanitiser les entrées utilisateur
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprimer les caractères HTML dangereux
    .substring(0, 1000) // Limiter la longueur
}

// Helper pour formater les numéros de téléphone
export function formatPhoneNumber(phone: string): string {
  // Supprimer tous les caractères non numériques
  const digits = phone.replace(/\D/g, '')
  
  // Format français (0X XX XX XX XX)
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.substring(0, 2)} ${digits.substring(2, 4)} ${digits.substring(4, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`
  }
  
  // Format international (+33X XX XX XX XX)
  if (digits.length === 11 && digits.startsWith('33')) {
    return `+${digits.substring(0, 2)} ${digits.substring(2, 3)} ${digits.substring(3, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`
  }
  
  return phone // Retourner tel quel si pas de format reconnu
}