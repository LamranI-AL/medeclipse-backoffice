'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { login } from '@/actions/auth/login'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Afficher les erreurs depuis les paramètres URL
  useEffect(() => {
    const urlError = searchParams?.get('error')
    if (urlError) {
      switch (urlError) {
        case 'account-disabled':
          setError('Votre compte a été désactivé. Contactez l\'administrateur.')
          break
        case 'session-error':
          setError('Erreur de session. Veuillez vous reconnecter.')
          break
        default:
          setError('Une erreur est survenue lors de la connexion.')
      }
    }
  }, [searchParams])

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      
      const result = await login(formData)
      
      if (result.success && result.user) {
        // Déterminer la redirection selon le rôle
        const redirectUrl = getRedirectUrl(result.user.role)
        
        // Vérifier s'il y a une URL de redirection demandée
        const requestedRedirect = searchParams?.get('redirect')
        const finalRedirect = requestedRedirect || redirectUrl
        
        router.push(finalRedirect)
        router.refresh()
      } else {
        setError(result.error || 'Erreur de connexion')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Erreur inattendue lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const getRedirectUrl = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return '/dashboard/admin'
      case 'dept_manager':
        return '/dashboard/manager'
      case 'employee':
        return '/dashboard/employee'
      case 'client':
        return '/dashboard/client'
      default:
        return '/dashboard'
    }
  }

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </Form>

      {/* Liens utiles */}
      <div className="text-center space-y-2">
        <Button 
          variant="link" 
          size="sm"
          disabled={isLoading}
          onClick={() => {
            // Auto-remplir avec les données de test
            form.setValue('email', 'admin@medeclipse.com')
            form.setValue('password', 'Admin123!')
          }}
        >
          Utiliser le compte de test
        </Button>
        
        <div className="text-xs text-gray-500">
          Mot de passe oublié ? Contactez votre administrateur
        </div>
      </div>
    </div>
  )
}