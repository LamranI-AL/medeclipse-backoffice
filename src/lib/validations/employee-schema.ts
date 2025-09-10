// Schémas de validation Zod pour les employés
import { z } from 'zod'

// Schéma pour l'adresse
export const addressSchema = z.object({
  street: z.string().min(1, 'Rue requise'),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  country: z.string().length(2, 'Code pays ISO 2 lettres requis').default('FR'),
})

// Schéma pour le contact d'urgence
export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Nom du contact requis'),
  relationship: z.string().min(1, 'Relation requise'),
  phone: z.string().min(10, 'Numéro de téléphone requis'),
  email: z.string().email('Email invalide').optional(),
})

// Schéma de création d'employé
export const createEmployeeSchema = z.object({
  // Informations personnelles
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone requis'),
  dateOfBirth: z.string().pipe(z.coerce.date()),
  
  // Adresse
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  
  // Informations professionnelles
  departmentId: z.string().uuid('ID département invalide'),
  positionId: z.string().uuid('ID poste invalide'),
  managerId: z.string().uuid('ID manager invalide').optional(),
  hireDate: z.string().pipe(z.coerce.date()),
  
  // Informations médicales (optionnelles)
  medicalLicenseNumber: z.string().optional(),
  licenseExpiry: z.string().pipe(z.coerce.date()).optional(),
})

// Schéma de mise à jour d'employé
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().uuid('ID employé invalide'),
})

// Schéma de recherche d'employés
export const searchEmployeesSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated', 'retired']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Types dérivés des schémas
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type SearchEmployeesInput = z.infer<typeof searchEmployeesSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>