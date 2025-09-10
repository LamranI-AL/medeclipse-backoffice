'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authClient } from '@/lib/auth/client'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialiser Better Auth côté client
    const initializeAuth = async () => {
      try {
        // Vérifier la session existante
        await authClient.getSession()
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initialisation...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}