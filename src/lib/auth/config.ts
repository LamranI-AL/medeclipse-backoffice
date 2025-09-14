import { betterAuth } from "better-auth"
import { db } from "@/lib/db/neon"
import { employees, clients, sessions } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const auth = betterAuth({
  database: {
    provider: "pg",
    url: process.env.DATABASE_URL!,
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Désactivé pour simplifier le développement
  },
  
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    },
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "employee"
      },
      userType: {
        type: "string",
        required: true,
        defaultValue: "employee"
      },
      departmentId: {
        type: "string",
      },
      isActive: {
        type: "boolean",
        defaultValue: true
      }
    }
  },
  
  // Configuration personnalisée pour gérer employees et clients
  advanced: {
    generateId: () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      // Fallback pour les environnements sans crypto.randomUUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    
    // Fonction personnalisée pour trouver un utilisateur
    hooks: {
      before: [
        {
          matcher: (context) => {
            return context.path === "/sign-in"
          },
          handler: async (request) => {
            const body = await request.json()
            const { email, password } = body
            
            // Chercher dans les employés d'abord
            const employee = await db
              .select()
              .from(employees)
              .where(eq(employees.email, email))
              .limit(1)
            
            if (employee[0]) {
              // Vérifier le mot de passe
              const isValid = await bcrypt.compare(password, employee[0].passwordHash || '')
              if (isValid && employee[0].isActive) {
                return {
                  user: {
                    id: employee[0].id,
                    email: employee[0].email,
                    name: `${employee[0].firstName} ${employee[0].lastName}`,
                    role: employee[0].role,
                    userType: 'employee',
                    departmentId: employee[0].departmentId,
                    isActive: employee[0].isActive
                  }
                }
              }
            }
            
            // Chercher dans les clients
            const client = await db
              .select()
              .from(clients)
              .where(eq(clients.contactEmail, email))
              .limit(1)
            
            if (client[0]) {
              const isValid = await bcrypt.compare(password, client[0].passwordHash || '')
              if (isValid && client[0].isActive) {
                return {
                  user: {
                    id: client[0].id,
                    email: client[0].contactEmail,
                    name: client[0].companyName,
                    role: 'client',
                    userType: 'client',
                    isActive: client[0].isActive
                  }
                }
              }
            }
            
            throw new Error('Identifiants invalides')
          }
        }
      ],
      
      after: [
        {
          matcher: (context) => {
            return context.path === "/sign-in"
          },
          handler: async (request, context) => {
            // Mettre à jour la dernière connexion
            const user = context.user
            if (user) {
              if (user.userType === 'employee') {
                await db
                  .update(employees)
                  .set({ lastLogin: new Date() })
                  .where(eq(employees.id, user.id))
              } else if (user.userType === 'client') {
                await db
                  .update(clients)
                  .set({ lastLogin: new Date() })
                  .where(eq(clients.id, user.id))
              }
            }
          }
        }
      ]
    }
  }
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User