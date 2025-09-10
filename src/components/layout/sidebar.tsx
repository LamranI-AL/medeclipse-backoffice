'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings, 
  Home,
  Building2,
  UserCheck
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    title: 'Gestion RH',
    items: [
      {
        title: 'Employés',
        href: '/employees',
        icon: Users
      },
      {
        title: 'Départements',
        href: '/departments',
        icon: Building2
      },
      {
        title: 'Postes',
        href: '/positions',
        icon: FileText
      },
      {
        title: 'Contrats',
        href: '/contracts', 
        icon: FileText
      },
      {
        title: 'Congés & Absences',
        href: '/leaves',
        icon: Calendar
      },
      {
        title: 'Évaluations',
        href: '/evaluations',
        icon: UserCheck
      }
    ]
  },
  {
    title: 'Rapports & Paramètres',
    items: [
      {
        title: 'Rapports RH',
        href: '/reports',
        icon: BarChart3
      },
      {
        title: 'Paramètres',
        href: '/settings',
        icon: Settings
      }
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">MedEclipse</h2>
            <p className="text-xs text-muted-foreground">Backoffice RH</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {sidebarItems.map((section, index) => (
          <div key={index} className="space-y-2">
            {/* Section avec items */}
            {section.items ? (
              <div>
                <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-9 px-3",
                          isActive && "bg-secondary text-secondary-foreground font-medium"
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="mr-3 h-4 w-4" />
                          {item.title}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Item simple */
              <Button
                variant={pathname === section.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-9 px-3",
                  pathname === section.href && "bg-secondary text-secondary-foreground font-medium"
                )}
                asChild
              >
                <Link href={section.href}>
                  <section.icon className="mr-3 h-4 w-4" />
                  {section.title}
                </Link>
              </Button>
            )}
            
            {index < sidebarItems.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@medeclipse.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}