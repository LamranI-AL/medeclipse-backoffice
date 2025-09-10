import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports RH</h1>
          <p className="text-muted-foreground">
            Analyses et statistiques des ressources humaines
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exporter tous les rapports
        </Button>
      </div>

      {/* Rapports disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Effectifs</span>
            </CardTitle>
            <CardDescription>
              Analyse des effectifs par département
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total employés</span>
                <span className="font-medium">245</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Nouveaux ce mois</span>
                <span className="font-medium text-green-600">+12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taux de rotation</span>
                <span className="font-medium">3.2%</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Congés & Absences</span>
            </CardTitle>
            <CardDescription>
              Statistiques des congés et absences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Taux d'absentéisme</span>
                <span className="font-medium">2.8%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Congés approuvés</span>
                <span className="font-medium">127</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Jours moyens/employé</span>
                <span className="font-medium">18.5</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Performance</span>
            </CardTitle>
            <CardDescription>
              Analyse des évaluations de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Note moyenne</span>
                <span className="font-medium">4.2/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Évaluations complétées</span>
                <span className="font-medium">89%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Promotions recommandées</span>
                <span className="font-medium">12</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Contrats</span>
            </CardTitle>
            <CardDescription>
              Analyse des types de contrats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>CDI</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CDD</span>
                <span className="font-medium">12%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Stages</span>
                <span className="font-medium">3%</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Coûts RH</span>
            </CardTitle>
            <CardDescription>
              Analyse des coûts et budgets RH
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Masse salariale</span>
                <span className="font-medium">12.5M€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Coût moyen/employé</span>
                <span className="font-medium">51k€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Évolution annuelle</span>
                <span className="font-medium text-green-600">+3.8%</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Diversité</span>
            </CardTitle>
            <CardDescription>
              Analyse de la diversité et parité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Parité H/F</span>
                <span className="font-medium">52/48%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Âge moyen</span>
                <span className="font-medium">38 ans</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ancienneté moyenne</span>
                <span className="font-medium">6.2 ans</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapports personnalisés */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rapports Personnalisés</CardTitle>
          <CardDescription>
            Créez des rapports sur mesure selon vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Rapport mensuel</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">Tableau de bord</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span className="text-sm">Analyse tendances</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}