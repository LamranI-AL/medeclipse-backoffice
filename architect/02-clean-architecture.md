# Clean Architecture Next.js avec Server Actions - MedEclipse

## 🏛️ Principes d'Architecture Moderne

### Approche Server Actions
- **Server Actions** pour toutes les mutations de données
- **Server Components** par défaut pour les performances
- **Client Components** uniquement pour l'interactivité
- **Actions centralisées** dans un dossier dédié
- **Base de données Neon** pour la simplicité et performance

## 📁 Structure des Dossiers Moderne

```
src/
├── app/                          # App Router Next.js 15+
│   ├── (auth)/                   # Route groups
│   │   ├── login/
│   │   │   └── page.tsx         # Server Component
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── hr/                   # Service RH
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx     # Server Component (liste)
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx # Server Component (détails)
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── contracts/
│   │   │   ├── leaves/
│   │   │   └── evaluations/
│   │   └── layout.tsx           # Server Component
│   ├── api/                      # API Routes (optionnel)
│   │   └── v1/
│   │       └── hr/              # Seulement pour API externes
│   ├── globals.css
│   ├── layout.tsx               # Server Component
│   └── page.tsx                 # Server Component
├── actions/                      # 🔥 Server Actions centralisées
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── logout.ts
│   ├── hr/
│   │   ├── employees/
│   │   │   ├── create-employee.ts
│   │   │   ├── update-employee.ts
│   │   │   ├── delete-employee.ts
│   │   │   └── get-employees.ts
│   │   ├── contracts/
│   │   │   ├── create-contract.ts
│   │   │   ├── renew-contract.ts
│   │   │   └── terminate-contract.ts
│   │   ├── leaves/
│   │   │   ├── request-leave.ts
│   │   │   ├── approve-leave.ts
│   │   │   └── reject-leave.ts
│   │   └── evaluations/
│   │       ├── create-evaluation.ts
│   │       └── submit-evaluation.ts
│   └── shared/                   # Actions communes
│       ├── upload-file.ts
│       └── send-notification.ts
├── lib/                          # Utilitaires et configuration
│   ├── db/                       # Configuration Neon
│   │   ├── neon.ts              # Client Neon
│   │   ├── schema.ts            # Schéma Drizzle
│   │   └── queries/             # Requêtes réutilisables
│   │       ├── employees.ts
│   │       ├── contracts.ts
│   │       └── leaves.ts
│   ├── validations/             # Schémas Zod
│   │   ├── employee-schema.ts
│   │   ├── contract-schema.ts
│   │   └── leave-schema.ts
│   ├── utils.ts                 # Utilitaires généraux
│   ├── constants.ts             # Constantes
│   └── types.ts                 # Types TypeScript
├── components/                   # Composants UI
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── forms/                   # Composants formulaires (Client)
│   │   ├── employee-form.tsx
│   │   ├── contract-form.tsx
│   │   └── leave-form.tsx
│   ├── tables/                  # Composants tableaux (Server)
│   │   ├── employees-table.tsx
│   │   └── contracts-table.tsx
│   ├── cards/                   # Composants cartes (Server)
│   │   ├── employee-card.tsx
│   │   └── dashboard-cards.tsx
│   └── layout/                  # Composants mise en page
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── navigation.tsx
└── tests/                       # Tests
    ├── actions/                 # Tests des actions
    ├── components/
    └── integration/
```

## 🔄 Flux de Données avec Server Actions

### Server Action Flow (Moderne)
```
Client Component → Server Action → Neon DB → Revalidate → UI Update
```

### Exemple Concret: Création d'Employé

1. **Client Component** (`components/forms/employee-form.tsx`)
   ```tsx
   'use client'
   
   import { createEmployee } from '@/actions/hr/employees/create-employee'
   
   export function EmployeeForm() {
     async function handleSubmit(formData: FormData) {
       const result = await createEmployee(formData)
       if (result.success) {
         // Redirection ou toast de succès
       }
     }
   
     return (
       <form action={handleSubmit}>
         <input name="firstName" placeholder="Prénom" />
         <input name="lastName" placeholder="Nom" />
         <button type="submit">Créer</button>
       </form>
     )
   }
   ```

2. **Server Action** (`actions/hr/employees/create-employee.ts`)
   ```ts
   'use server'
   
   import { z } from 'zod'
   import { db } from '@/lib/db/neon'
   import { employees } from '@/lib/db/schema'
   import { revalidatePath } from 'next/cache'
   
   const CreateEmployeeSchema = z.object({
     firstName: z.string().min(2),
     lastName: z.string().min(2),
     email: z.string().email(),
   })
   
   export async function createEmployee(formData: FormData) {
     try {
       const validatedFields = CreateEmployeeSchema.parse({
         firstName: formData.get('firstName'),
         lastName: formData.get('lastName'),
         email: formData.get('email'),
       })
   
       const [newEmployee] = await db
         .insert(employees)
         .values({
           ...validatedFields,
           employeeNumber: generateEmployeeNumber(),
           status: 'active',
           createdAt: new Date(),
         })
         .returning()
   
       revalidatePath('/dashboard/hr/employees')
       return { success: true, employee: newEmployee }
     } catch (error) {
       return { success: false, error: 'Failed to create employee' }
     }
   }
   ```

3. **Server Component** (`app/(dashboard)/hr/employees/page.tsx`)
   ```tsx
   import { getEmployees } from '@/actions/hr/employees/get-employees'
   import { EmployeeCard } from '@/components/cards/employee-card'
   
   export default async function EmployeesPage() {
     const employees = await getEmployees()
   
     return (
       <div>
         <h1>Employés</h1>
         <div className="grid gap-4">
           {employees.map((employee) => (
             <EmployeeCard key={employee.id} employee={employee} />
           ))}
         </div>
       </div>
     )
   }
   ```

## 🎯 Injection de Dépendances

### Container de Dépendances
```typescript
// shared/di/container.ts
class DIContainer {
  private static instance: DIContainer;
  private dependencies = new Map();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(token: string, implementation: T): void {
    this.dependencies.set(token, implementation);
  }

  resolve<T>(token: string): T {
    return this.dependencies.get(token);
  }
}
```

### Configuration des Dépendances
```typescript
// shared/di/config.ts
export function configureDependencies() {
  const container = DIContainer.getInstance();
  
  // Repositories
  container.register('EmployeeRepository', new EmployeeRepositoryImpl());
  
  // Services
  container.register('EmployeeService', new EmployeeService());
  
  // Use Cases
  container.register('CreateEmployeeUseCase', new CreateEmployeeUseCase());
}
```

## 🧪 Testabilité

### Tests Unitaires par Couche
```typescript
// core/use-cases/employee/__tests__/create-employee.test.ts
describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let mockRepository: jest.Mocked<EmployeeRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new CreateEmployeeUseCase(mockRepository);
  });

  it('should create employee with valid data', async () => {
    const employeeData = createValidEmployeeData();
    const result = await useCase.execute(employeeData);
    
    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining(employeeData)
    );
  });
});
```

## 📝 Conventions de Code

### Naming Conventions
- **Entities**: PascalCase (Employee, Contract)
- **Use Cases**: PascalCase + UseCase suffix (CreateEmployeeUseCase)
- **Services**: PascalCase + Service suffix (EmployeeService)
- **Repositories**: PascalCase + Repository suffix (EmployeeRepository)
- **API Routes**: kebab-case (employees, contracts)

### File Organization
- Un fichier par classe/interface
- Index files pour les exports
- Tests à côté des fichiers source

### Error Handling
```typescript
// shared/errors/domain-errors.ts
export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class EmployeeNotFoundError extends DomainError {
  constructor(employeeId: string) {
    super(`Employee with ID ${employeeId} not found`, 'EMPLOYEE_NOT_FOUND');
  }
}
```

## 🔄 Middleware et Guards

### Authentication Middleware
```typescript
// app/api/middleware.ts
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Vérification du token
    return handler(req, res);
  };
}
```

### Validation Middleware
```typescript
// shared/middleware/validation.ts
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function(handler: (data: T) => Promise<Response>) {
    return async (request: Request) => {
      const body = await request.json();
      const validationResult = schema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { errors: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      return handler(validationResult.data);
    };
  };
}
```

Cette architecture garantit:
- ✅ Séparation claire des responsabilités
- ✅ Testabilité maximale
- ✅ Extensibilité pour les futurs services
- ✅ Maintenance facilitée
- ✅ Performance optimisée