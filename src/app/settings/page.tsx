import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Shield, Bell, Database, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration et préférences du système MedEclipse
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation des paramètres */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
            <CardDescription>
              Sélectionnez une section à configurer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profil utilisateur
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Sécurité & Accès
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Base de données
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Palette className="h-4 w-4 mr-2" />
                Apparence
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Système
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contenu des paramètres */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profil utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Profil Utilisateur</span>
              </CardTitle>
              <CardDescription>
                Informations personnelles et préférences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" placeholder="Administrateur" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" placeholder="Système" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@medeclipse.com" />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge>Administrateur RH</Badge>
                    <Badge variant="secondary">Tous les accès</Badge>
                  </div>
                </div>
                <Button>Mettre à jour le profil</Button>
              </div>
            </CardContent>
          </Card>

          {/* Paramètres système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Paramètres Système</span>
              </CardTitle>
              <CardDescription>
                Configuration générale de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nom de l'établissement</Label>
                  <Input id="companyName" placeholder="MedEclipse Centre Hospitalier" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Input id="timezone" placeholder="Europe/Paris" />
                  </div>
                  <div>
                    <Label htmlFor="language">Langue</Label>
                    <Input id="language" placeholder="Français" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Input id="dateFormat" placeholder="DD/MM/YYYY" />
                </div>
                <Button>Sauvegarder les paramètres</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouvelles demandes</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications de nouvelles demandes
                    </p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels d'évaluation</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les évaluations en retard
                    </p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Congés approchant</p>
                    <p className="text-sm text-muted-foreground">
                      Alertes pour les congés programmés
                    </p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <Button>Mettre à jour les notifications</Button>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Sécurité & Accès</span>
              </CardTitle>
              <CardDescription>
                Paramètres de sécurité et de connexion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Changer le mot de passe</h4>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Mot de passe actuel" />
                    <Input type="password" placeholder="Nouveau mot de passe" />
                    <Input type="password" placeholder="Confirmer le nouveau mot de passe" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">
                      Sécurité renforcée pour votre compte
                    </p>
                  </div>
                  <Badge variant="secondary">Désactivé</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button>Changer le mot de passe</Button>
                  <Button variant="outline">Activer 2FA</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}