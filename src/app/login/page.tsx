import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedEclipse</h1>
          <p className="text-gray-600 mt-2">Backoffice médical</p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour accéder au backoffice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Chargement...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Informations de test */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Compte de test
          </h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Email:</strong> admin@medeclipse.com</p>
            <p><strong>Mot de passe:</strong> Admin123!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2024 MedEclipse. Tous droits réservés.
        </div>
      </div>
    </div>
  )
}