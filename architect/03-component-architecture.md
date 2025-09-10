# Component Architecture - MedEclipse BackOffice

## Vue d'ensemble

Cette architecture de composants suit les principes de clean code et de séparation des préoccupations pour une application Next.js 15 moderne avec Server Actions.

## Structure des Composants

```
src/components/
├── ui/                    # Composants UI de base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── table.tsx
│   ├── select.tsx
│   ├── label.tsx
│   ├── separator.tsx
│   ├── badge.tsx
│   └── index.ts          # Exports centralisés
├── layout/               # Composants de mise en page
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── index.ts
├── forms/                # Formulaires métier
│   ├── employee-form.tsx
│   └── index.ts
├── tables/               # Tables de données
│   ├── employees-table.tsx
│   └── index.ts
└── index.ts             # Point d'entrée principal
```

## Principes d'Architecture

### 1. Séparation des Préoccupations

- **UI Components** : Composants réutilisables sans logique métier
- **Layout Components** : Structure et navigation de l'application
- **Form Components** : Gestion des formulaires avec validation
- **Table Components** : Affichage et manipulation des données

### 2. Clean Code Principles

```typescript
// ✅ Bon exemple - Composant propre et réutilisable
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'default', size = 'md', ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }))} {...props} />
}
```

### 3. Types et Interfaces

```typescript
// Types centralisés dans src/types/index.ts
export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  // ...autres propriétés
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: any
}
```

## Patterns d'Implémentation

### 1. Form Pattern avec Server Actions

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEmployee } from '@/actions'

export function EmployeeForm() {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
  })

  const onSubmit = async (values: EmployeeFormData) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })

    const result = await createEmployee(formData)
    
    if (result.success) {
      form.reset()
    } else {
      form.setError('root', { message: result.error })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### 2. Table Pattern avec TanStack Table

```typescript
'use client'

import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'

export function EmployeesTable({ data }: { data: Employee[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Autres configurations...
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {/* Header content */}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {/* Body content */}
      </TableBody>
    </Table>
  )
}
```

### 3. Layout Pattern

```typescript
export function Sidebar() {
  return (
    <div className="w-64 bg-card border-r">
      <nav className="p-4">
        {/* Navigation items */}
      </nav>
    </div>
  )
}

export function Header() {
  return (
    <header className="h-16 border-b bg-background/95">
      {/* Header content */}
    </header>
  )
}
```

## Structure d'Import/Export

### Exports Centralisés

```typescript
// src/components/index.ts
export * from './ui'
export * from './layout'
export * from './forms'
export * from './tables'

// src/components/ui/index.ts
export { Button } from './button'
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
// ...autres exports

// Usage dans l'application
import { Button, Card, EmployeeForm, EmployeesTable } from '@/components'
```

### Points d'Entrée par Domaine

```typescript
// src/lib/index.ts
export { cn } from './utils'
export { db, withTransaction } from './db/neon'

// src/actions/index.ts
export { createEmployee } from './hr/employees/create-employee'

// src/types/index.ts
export type { Employee, Department, Position, ActionResult }
```

## Bonnes Pratiques

### 1. Nommage des Composants

- **PascalCase** pour les composants : `EmployeeForm`
- **camelCase** pour les props : `onSuccess`, `isLoading`
- **kebab-case** pour les fichiers : `employee-form.tsx`

### 2. Props et Interfaces

```typescript
interface ComponentProps {
  required: string
  optional?: boolean
  children?: React.ReactNode
  onAction?: () => void
}
```

### 3. Gestion des États

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// Pour les formulaires
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

### 4. Composition plutôt qu'Héritage

```typescript
// ✅ Composition
function FormCard({ title, children }: FormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Usage
<FormCard title="Informations Personnelles">
  <EmployeePersonalFields />
</FormCard>
```

## Tests et Documentation

### 1. Structure de Test

```
src/
├── components/
│   ├── __tests__/
│   │   ├── ui.test.tsx
│   │   ├── forms.test.tsx
│   │   └── tables.test.tsx
```

### 2. Documentation des Composants

```typescript
/**
 * Composant de formulaire pour créer/modifier un employé
 * 
 * @param onSuccess - Callback appelé en cas de succès
 * @param onCancel - Callback appelé lors de l'annulation
 * @param initialData - Données initiales pour la modification
 */
export function EmployeeForm({ onSuccess, onCancel, initialData }: EmployeeFormProps) {
  // Implementation
}
```

## Performance et Optimisation

### 1. Lazy Loading

```typescript
const EmployeeForm = lazy(() => import('./forms/employee-form'))

// Usage avec Suspense
<Suspense fallback={<Loading />}>
  <EmployeeForm />
</Suspense>
```

### 2. Memoization

```typescript
const MemoizedTable = memo(EmployeesTable)

const columns = useMemo(
  () => [
    // Column definitions
  ],
  []
)
```

Cette architecture garantit une application maintenable, testable et évolutive pour le système MedEclipse BackOffice.