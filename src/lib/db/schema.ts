// Schéma Drizzle pour Neon PostgreSQL
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  date,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const employeeStatusEnum = pgEnum('employee_status', [
  'active',
  'on_leave', 
  'suspended',
  'terminated',
  'retired'
])

export const contractTypeEnum = pgEnum('contract_type', [
  'permanent',
  'temporary', 
  'internship',
  'consultant',
  'part_time'
])

export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'pending_signature',
  'active',
  'suspended',
  'terminated',
  'expired'
])

export const leaveTypeEnum = pgEnum('leave_type', [
  'annual',
  'sick',
  'maternity',
  'paternity',
  'emergency',
  'unpaid',
  'sabbatical'
])

export const leaveStatusEnum = pgEnum('leave_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'in_progress',
  'completed'
])

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin',
  'dept_manager',
  'employee',
  'client'
])

export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled'
])

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'file',
  'image',
  'audio',
  'video'
])

export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', [
  'admin',
  'member',
  'observer'
])

// Tables principales

// Départements
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Postes
export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 150 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  departmentId: uuid('department_id').references(() => departments.id),
  description: text('description'),
  isManager: boolean('is_manager').default(false),
  isMedical: boolean('is_medical').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Employés
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  
  // Informations personnelles
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  
  // Authentification
  passwordHash: varchar('password_hash', { length: 255 }),
  role: userRoleEnum('role').default('employee'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  emailVerified: boolean('email_verified').default(false),
  
  // Adresse (JSON pour flexibilité)
  address: jsonb('address'),
  emergencyContact: jsonb('emergency_contact'),
  
  // Informations professionnelles
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  status: employeeStatusEnum('status').default('active'),
  departmentId: uuid('department_id').references(() => departments.id),
  positionId: uuid('position_id').references(() => positions.id),
  managerId: uuid('manager_id').references(() => employees.id),
  
  // Informations médicales (si applicable)
  medicalLicenseNumber: varchar('medical_license_number', { length: 50 }),
  licenseExpiry: date('license_expiry'),
  
  // Audit
  createdBy: uuid('created_by').references(() => employees.id),
  updatedBy: uuid('updated_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Contrats
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  contractNumber: varchar('contract_number', { length: 30 }).notNull().unique(),
  
  // Type et statut
  type: contractTypeEnum('type').notNull(),
  status: contractStatusEnum('status').default('draft'),
  
  // Dates
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  signatureDate: date('signature_date'),
  
  // Rémunération
  salaryAmount: decimal('salary_amount', { precision: 10, scale: 2 }).notNull(),
  salaryCurrency: varchar('salary_currency', { length: 3 }).default('EUR'),
  
  // Temps de travail
  workingHoursPerWeek: decimal('working_hours_per_week', { precision: 4, scale: 2 }).default('35.00'),
  
  // Avantages et clauses (JSON pour flexibilité)
  benefits: jsonb('benefits').default('[]'),
  clauses: jsonb('clauses').default('[]'),
  
  // Métadonnées
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Congés
export const leaves = pgTable('leaves', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  
  // Type et statut
  type: leaveTypeEnum('type').notNull(),
  status: leaveStatusEnum('status').default('pending'),
  
  // Dates
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  requestedDate: timestamp('requested_date').defaultNow().notNull(),
  
  // Calculs
  totalDays: integer('total_days').notNull(),
  workingDays: integer('working_days').notNull(),
  
  // Détails
  reason: text('reason'),
  employeeComments: text('employee_comments'),
  managerComments: text('manager_comments'),
  
  // Remplacement
  replacementEmployeeId: uuid('replacement_employee_id').references(() => employees.id),
  
  // Métadonnées
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Clients
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull().unique(),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  address: jsonb('address'),
  
  // Authentification
  passwordHash: varchar('password_hash', { length: 255 }),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  emailVerified: boolean('email_verified').default(false),
  
  // Audit
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Projets
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  clientId: uuid('client_id').references(() => clients.id),
  departmentId: uuid('department_id').references(() => departments.id),
  managerId: uuid('manager_id').references(() => employees.id),
  status: projectStatusEnum('status').default('draft'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  
  // Métadonnées
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  settings: jsonb('settings').default('{}'),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Membres des workspaces
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').notNull(), // Peut être employee_id ou client_id
  userType: varchar('user_type', { length: 20 }).notNull(), // 'employee' ou 'client'
  role: workspaceMemberRoleEnum('role').default('member'),
  permissions: jsonb('permissions').default('[]'),
  
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

// Messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  senderId: uuid('sender_id').notNull(),
  senderType: varchar('sender_type', { length: 20 }).notNull(), // 'employee' ou 'client'
  content: text('content').notNull(),
  messageType: messageTypeEnum('message_type').default('text'),
  threadId: uuid('thread_id').references(() => messages.id), // Pour les réponses
  attachments: jsonb('attachments').default('[]'),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Permissions
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  scope: varchar('scope', { length: 50 }),
  description: text('description'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations rôles-permissions
export const rolePermissions = pgTable('role_permissions', {
  role: userRoleEnum('role').notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Sessions (pour Better Auth)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull(),
  userType: varchar('user_type', { length: 20 }).notNull(), // 'employee' ou 'client'
  expiresAt: timestamp('expires_at').notNull(),
  data: jsonb('data').default('{}'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations Drizzle
export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  positions: many(positions),
}))

export const positionsRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  employees: many(employees),
}))

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),
  subordinates: many(employees),
  contracts: many(contracts),
  leaves: many(leaves),
  leavesAsReplacement: many(leaves),
}))

export const contractsRelations = relations(contracts, ({ one }) => ({
  employee: one(employees, {
    fields: [contracts.employeeId],
    references: [employees.id],
  }),
}))

export const leavesRelations = relations(leaves, ({ one }) => ({
  employee: one(employees, {
    fields: [leaves.employeeId],
    references: [employees.id],
  }),
  replacementEmployee: one(employees, {
    fields: [leaves.replacementEmployeeId],
    references: [employees.id],
  }),
}))

export const clientsRelations = relations(clients, ({ many, one }) => ({
  projects: many(projects),
  createdByEmployee: one(employees, {
    fields: [clients.createdBy],
    references: [employees.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  manager: one(employees, {
    fields: [projects.managerId],
    references: [employees.id],
  }),
  createdByEmployee: one(employees, {
    fields: [projects.createdBy],
    references: [employees.id],
  }),
  workspaces: many(workspaces),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  project: one(projects, {
    fields: [workspaces.projectId],
    references: [projects.id],
  }),
  members: many(workspaceMembers),
  messages: many(messages),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [messages.workspaceId],
    references: [workspaces.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.threadId],
    references: [messages.id],
  }),
  replies: many(messages),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))

// Types TypeScript dérivés du schéma
export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
export type Position = typeof positions.$inferSelect
export type NewPosition = typeof positions.$inferInsert
export type Contract = typeof contracts.$inferSelect
export type NewContract = typeof contracts.$inferInsert
export type Leave = typeof leaves.$inferSelect
export type NewLeave = typeof leaves.$inferInsert

// Nouveaux types pour l'authentification et workspaces
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert
export type RolePermission = typeof rolePermissions.$inferSelect
export type Session = typeof sessions.$inferSelect

// Types d'union pour les utilisateurs
export type User = Employee | Client
export type UserRole = 'super_admin' | 'admin' | 'dept_manager' | 'employee' | 'client'
export type UserType = 'employee' | 'client'

// Types pour l'authentification
export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  role: UserRole
  userType: UserType
  departmentId?: string | null
  isActive: boolean
}

// Types pour les permissions
export interface PermissionCheck {
  resource: string
  action: string
  scope?: string
  userId?: string
  departmentId?: string
  projectId?: string
}