# Workflow de Développement - MedEclipse

## 🔄 Méthodologie Git Flow

### Structure des Branches
```
main         → Production (protégée)
├── staging  → Pré-production (protégée)  
├── develop  → Intégration continue
├── feature/* → Nouvelles fonctionnalités
├── hotfix/* → Corrections urgentes production
├── release/* → Préparation des releases
└── bugfix/* → Corrections de bugs
```

### Règles de Protection des Branches
```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "ci/tests"
        - "ci/security-scan" 
        - "ci/build"
        - "ci/e2e-tests"
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
      restrictions:
        users: []
        teams: ["tech-leads", "architects"]
    
  staging:
    required_status_checks:
      strict: true
      contexts:
        - "ci/tests"
        - "ci/build"
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
```

### Conventions de Nommage
```bash
# Branches
feature/HR-123-employee-creation-form
bugfix/HR-456-leave-calculation-error  
hotfix/URGENT-security-patch-auth
release/v1.2.0

# Commits (Conventional Commits)
feat(hr): add employee creation form with validation
fix(auth): resolve JWT token expiration issue
docs(api): update employee endpoints documentation
refactor(ui): extract reusable form components
test(hr): add unit tests for leave calculation
perf(db): optimize employee queries with indexes
chore(deps): update Next.js to v15.5.2
```

## 🛠️ Environment Setup Local

### Docker Compose pour Développement
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Application Next.js
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/medeclipse_dev
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=dev-secret-key
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev
    
  # Base de données PostgreSQL
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=medeclipse_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      
  # Redis pour cache et sessions
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      
  # MailHog pour tests email
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
      
  # Adminer pour gestion DB
  adminer:
    image: adminer:4
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=db

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile de Développement
```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies for better development experience
RUN apk add --no-cache \
    git \
    curl \
    bash

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["npm", "run", "dev"]
```

### Script de Setup Développeur
```bash
#!/bin/bash
# scripts/setup-dev.sh

set -e

echo "🚀 Setting up MedEclipse development environment..."

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 20+"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git not found. Please install Git"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Setup environment variables
setup_env() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env.local ]; then
        cp .env.example .env.local
        echo "📝 Created .env.local from template"
        echo "Please update the environment variables in .env.local"
    else
        echo "📄 .env.local already exists"
    fi
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    
    # Install global tools
    npm install -g \
        @next/codemod \
        prisma \
        typescript \
        eslint \
        prettier
}

# Setup Git hooks
setup_git_hooks() {
    echo "🎣 Setting up Git hooks..."
    
    # Install husky
    npx husky install
    
    # Add pre-commit hook
    npx husky add .husky/pre-commit "npm run lint-staged"
    
    # Add commit-msg hook for conventional commits
    npx husky add .husky/commit-msg "npx commitlint --edit $1"
    
    echo "✅ Git hooks configured"
}

# Setup database
setup_database() {
    echo "🗄️ Setting up database..."
    
    # Start Docker services
    docker-compose -f docker-compose.dev.yml up -d db redis
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    npx prisma migrate dev --name init
    
    # Generate Prisma client
    npx prisma generate
    
    # Seed database with sample data
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo "✅ Database setup complete"
}

# Setup VS Code
setup_vscode() {
    echo "💻 Setting up VS Code configuration..."
    
    mkdir -p .vscode
    
    # Settings
    cat > .vscode/settings.json << EOF
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.workingDirectories": ["./"],
  "files.exclude": {
    "**/.next": true,
    "**/node_modules": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
EOF

    # Extensions recommendations
    cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "prisma.prisma",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
EOF

    echo "✅ VS Code configuration created"
}

# Main setup flow
main() {
    check_prerequisites
    setup_env
    install_dependencies
    setup_git_hooks
    setup_database
    setup_vscode
    
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with your configuration"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo "4. Access database admin at http://localhost:8080"
    echo "5. View emails at http://localhost:8025"
    echo ""
    echo "Happy coding! 👨‍💻👩‍💻"
}

main "$@"
```

## 🧪 Tests et Qualité

### Configuration Jest
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'presentation/**/*.{ts,tsx}',
    'core/**/*.{ts,tsx}',
    'infrastructure/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Tests Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills pour Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/medeclipse_test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-secret',
};
```

### Test Utilities
```typescript
// tests/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Mock providers pour les tests
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Utilitaires de test personnalisés
export const createMockEmployee = (overrides = {}): Employee => ({
  id: 'emp-123',
  employeeNumber: 'EMP001',
  personalInfo: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@medeclipse.com',
    phone: '0123456789',
    dateOfBirth: new Date('1990-01-01'),
    nationality: 'FR',
    address: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
    },
    emergencyContact: {
      name: 'Marie Dupont',
      relationship: 'Épouse',
      phone: '0987654321',
    },
  },
  professionalInfo: {
    position: {
      id: 'pos-123',
      title: 'Médecin Généraliste',
      category: 'medical',
    },
    department: {
      id: 'dept-123',
      name: 'Médecine Générale',
      code: 'MG',
    },
    hireDate: new Date('2020-01-01'),
    seniority: 4,
  },
  status: 'active',
  createdAt: new Date('2020-01-01'),
  updatedAt: new Date(),
  ...overrides,
});

export const waitForLoadingToFinish = () =>
  waitFor(
    () => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    },
    { timeout: 5000 }
  );
```

### Exemple de Test Unitaire
```typescript
// presentation/components/business/employee/__tests__/employee-card.test.tsx
import { render, screen, fireEvent } from '@/tests/utils/test-utils';
import { EmployeeCard } from '../employee-card';
import { createMockEmployee } from '@/tests/utils/test-utils';

describe('EmployeeCard', () => {
  const mockEmployee = createMockEmployee();
  
  it('renders employee information correctly', () => {
    render(<EmployeeCard employee={mockEmployee} />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Médecin Généraliste')).toBeInTheDocument();
    expect(screen.getByText('#EMP001')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('calls onView when view button is clicked', () => {
    const mockOnView = jest.fn();
    render(<EmployeeCard employee={mockEmployee} onView={mockOnView} />);
    
    const viewButton = screen.getByText('Voir le profil');
    fireEvent.click(viewButton);
    
    expect(mockOnView).toHaveBeenCalledWith(mockEmployee);
  });

  it('displays compact variant correctly', () => {
    render(<EmployeeCard employee={mockEmployee} variant="compact" />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Médecin Généraliste')).toBeInTheDocument();
    
    // Details should not be visible in compact mode
    expect(screen.queryByText('jean.dupont@medeclipse.com')).not.toBeInTheDocument();
  });

  it('applies correct status color', () => {
    const activeEmployee = createMockEmployee({ status: 'active' });
    const { rerender } = render(<EmployeeCard employee={activeEmployee} />);
    
    expect(screen.getByText('active')).toHaveClass('bg-green-100', 'text-green-800');
    
    const suspendedEmployee = createMockEmployee({ status: 'suspended' });
    rerender(<EmployeeCard employee={suspendedEmployee} />);
    
    expect(screen.getByText('suspended')).toHaveClass('bg-red-100', 'text-red-800');
  });
});
```

### Tests d'Intégration API
```typescript
// tests/api/employees.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/v1/hr/employees/route';
import { prismaMock } from '@/tests/mocks/prisma';

jest.mock('@/infrastructure/database/prisma', () => ({
  default: prismaMock,
}));

describe('/api/v1/hr/employees', () => {
  describe('GET', () => {
    it('returns paginated employees list', async () => {
      const mockEmployees = [
        createMockEmployee({ id: '1', personalInfo: { firstName: 'Jean', lastName: 'Dupont' } }),
        createMockEmployee({ id: '2', personalInfo: { firstName: 'Marie', lastName: 'Martin' } }),
      ];

      prismaMock.employee.findMany.mockResolvedValue(mockEmployees);
      prismaMock.employee.count.mockResolvedValue(2);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/v1/hr/employees?page=1&limit=10',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('filters employees by department', async () => {
      const mockEmployees = [
        createMockEmployee({ 
          id: '1', 
          professionalInfo: { 
            department: { id: 'dept-123', name: 'Cardiologie', code: 'CARD' } 
          } 
        }),
      ];

      prismaMock.employee.findMany.mockResolvedValue(mockEmployees);
      prismaMock.employee.count.mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/v1/hr/employees?department=dept-123',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      await handler(req, res);

      expect(prismaMock.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: 'dept-123',
          }),
        })
      );
    });
  });

  describe('POST', () => {
    it('creates new employee successfully', async () => {
      const newEmployee = createMockEmployee();
      prismaMock.employee.create.mockResolvedValue(newEmployee);

      const employeeData = {
        personalInfo: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@medeclipse.com',
          phone: '0123456789',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
          emergencyContact: {
            name: 'Marie Dupont',
            relationship: 'Épouse',
            phone: '0987654321',
          },
        },
        professionalInfo: {
          positionId: 'pos-123',
          departmentId: 'dept-123',
          hireDate: '2024-01-01',
          workScheduleId: 'schedule-123',
        },
      };

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/v1/hr/employees',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: employeeData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.data.personalInfo.firstName).toBe('Jean');
    });

    it('validates required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/v1/hr/employees',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          personalInfo: {
            firstName: 'Jean',
            // lastName missing
          },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('VALIDATION_FAILED');
    });
  });
});
```

## 🚀 Scripts de Développement

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint-staged": "lint-staged",
    "prepare": "husky install",
    "clean": "rm -rf .next node_modules/.cache",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:down": "docker-compose -f docker-compose.dev.yml down",
    "analyze": "ANALYZE=true npm run build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Pre-commit Hooks
```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "**/*.{json,css,scss,md,mdx}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": [
      "@commitlint/config-conventional"
    ],
    "rules": {
      "scope-enum": [
        2,
        "always",
        [
          "hr",
          "auth",
          "ui",
          "api",
          "db",
          "config",
          "deps",
          "docs",
          "tests"
        ]
      ]
    }
  }
}
```

## 📋 Code Review Guidelines

### Pull Request Template
```markdown
<!-- .github/pull_request_template.md -->
## 🎯 Description

Brief description of what this PR does.

Fixes #(issue number)

## 🔄 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style changes (formatting, missing semi colons, etc)
- [ ] ♻️ Code refactor (no functional changes)
- [ ] ⚡ Performance improvements
- [ ] ✅ Test updates

## 🧪 How Has This Been Tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## 📋 Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 📸 Screenshots (if applicable)

## 🔗 Related PRs

## 📝 Additional Notes

Any additional information or context about the PR.
```

### Review Checklist
```typescript
// Code Review Checklist

/**
 * FUNCTIONALITY
 * ✅ Code does what it's supposed to do
 * ✅ Edge cases are handled
 * ✅ Error handling is appropriate
 * ✅ No obvious bugs or logic errors
 */

/**
 * DESIGN & ARCHITECTURE
 * ✅ Follows clean architecture principles
 * ✅ Separation of concerns is maintained
 * ✅ Dependencies flow in the right direction
 * ✅ No tight coupling between layers
 */

/**
 * CODE QUALITY
 * ✅ Code is readable and self-documenting
 * ✅ Variable and function names are descriptive
 * ✅ Functions are small and focused
 * ✅ No code duplication (DRY principle)
 * ✅ Consistent with existing code style
 */

/**
 * PERFORMANCE
 * ✅ No unnecessary re-renders in React components
 * ✅ Database queries are optimized
 * ✅ Large datasets are paginated
 * ✅ Caching is used appropriately
 */

/**
 * SECURITY
 * ✅ Input validation is implemented
 * ✅ SQL injection prevention
 * ✅ XSS protection
 * ✅ Authentication/authorization checks
 * ✅ No sensitive data in logs
 */

/**
 * TESTING
 * ✅ Unit tests cover the main functionality
 * ✅ Edge cases are tested
 * ✅ Integration tests for API endpoints
 * ✅ Tests are maintainable
 */

/**
 * DOCUMENTATION
 * ✅ Complex logic is documented
 * ✅ API changes are documented
 * ✅ README is updated if needed
 * ✅ Architecture decisions are recorded
 */
```

Ce workflow de développement garantit:
- ✅ Code de haute qualité et maintenable
- ✅ Collaboration efficace entre développeurs
- ✅ Intégration continue et déploiement sûr
- ✅ Tests automatisés à tous les niveaux
- ✅ Documentation technique à jour