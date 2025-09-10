# Spécifications des APIs - MedEclipse HR

## 🌐 Architecture API

### Standards et Conventions
- **Version**: v1 (dans l'URL `/api/v1/`)
- **Format**: JSON (Content-Type: application/json)
- **Authentification**: JWT Bearer Token
- **Pagination**: Cursor-based avec fallback offset
- **Codes de status HTTP**: Standards REST
- **Rate Limiting**: 1000 requêtes/minute par utilisateur
- **CORS**: Configuré pour les domaines autorisés

### Headers Standards
```http
# Request Headers
Authorization: Bearer <jwt-token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <unique-request-id>
X-Client-Version: 1.0.0

# Response Headers
X-Request-ID: <request-id>
X-Response-Time: <response-time-ms>
X-Rate-Limit-Remaining: <remaining-requests>
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

## 👥 API Employees

### GET /api/v1/hr/employees
Liste paginée des employés avec filtres avancés.

**Query Parameters:**
```typescript
interface EmployeeFilters {
  page?: number;              // Page courante (défaut: 1)
  limit?: number;             // Nombre d'éléments par page (défaut: 20, max: 100)
  cursor?: string;            // Cursor pour pagination
  search?: string;            // Recherche textuelle (nom, email, numéro)
  department?: string[];      // Filtrer par département(s)
  position?: string[];        // Filtrer par poste(s)
  status?: EmployeeStatus[];  // Filtrer par statut(s)
  hireDate?: {               // Filtrer par date d'embauche
    from?: string;           // ISO 8601 date
    to?: string;             // ISO 8601 date
  };
  hasContract?: boolean;      // Employés avec contrat actif
  isManager?: boolean;        // Employés managers
  specialization?: string[];  // Spécialisations médicales
  sortBy?: 'name' | 'hireDate' | 'department' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  include?: ('contracts' | 'leaves' | 'evaluations' | 'department')[];
}
```

**Response:**
```typescript
interface EmployeesResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    cursor?: string;
    nextCursor?: string;
  };
  filters: EmployeeFilters;
  meta: {
    requestId: string;
    responseTime: number;
    cached: boolean;
    cacheExpiry?: string;
  };
}
```

**Exemple de requête:**
```http
GET /api/v1/hr/employees?department=medical&status=active&include=department,contracts&sortBy=name&limit=50

Response: 200 OK
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employeeNumber": "MED202400001",
      "personalInfo": {
        "firstName": "Dr. Marie",
        "lastName": "Dubois",
        "email": "marie.dubois@medeclipse.com",
        "phone": "+33612345678"
      },
      "professionalInfo": {
        "position": {
          "id": "pos_001",
          "title": "Cardiologue Senior",
          "category": "medical"
        },
        "department": {
          "id": "dept_cardio",
          "name": "Cardiologie",
          "code": "CARD"
        },
        "hireDate": "2020-03-15T00:00:00Z",
        "seniority": 4
      },
      "status": "active",
      "createdAt": "2020-03-15T10:00:00Z",
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "totalPages": 4,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### POST /api/v1/hr/employees
Créer un nouveau employé.

**Request Body:**
```typescript
interface CreateEmployeeRequest {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;        // ISO 8601 date
    nationality?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
  };
  professionalInfo: {
    positionId: string;
    departmentId: string;
    managerId?: string;
    hireDate: string;           // ISO 8601 date
    workScheduleId: string;
    specializations?: string[];
  };
  medicalInfo?: {
    medicalLicenseNumber?: string;
    licenseExpiry?: string;     // ISO 8601 date
    insuranceProfessional: string;
  };
  initialContract?: {
    type: ContractType;
    salaryAmount: number;
    currency: string;
    workingHours: number;
    startDate: string;
    endDate?: string;
  };
}
```

**Response:**
```typescript
interface CreateEmployeeResponse {
  data: Employee;
  warnings?: string[];         // Avertissements non bloquants
  nextSteps: {
    action: string;
    description: string;
    dueDate?: string;
  }[];
  meta: {
    requestId: string;
    employeeNumber: string;     // Généré automatiquement
    notifications: {
      email: boolean;
      manager: boolean;
      hr: boolean;
    };
  };
}
```

### GET /api/v1/hr/employees/:id
Détails complets d'un employé.

**Path Parameters:**
- `id`: UUID de l'employé

**Query Parameters:**
```typescript
interface EmployeeDetailParams {
  include?: ('contracts' | 'leaves' | 'evaluations' | 'certifications' | 'documents' | 'activities')[];
  contractsLimit?: number;     // Limiter le nombre de contrats retournés
  leavesLimit?: number;        // Limiter le nombre de congés retournés
  includeInactive?: boolean;   // Inclure les données inactives
}
```

### PUT /api/v1/hr/employees/:id
Mettre à jour un employé (patch partiel supporté).

**Request Body:** Même structure que POST mais tous les champs sont optionnels.

**Headers spéciaux:**
```http
If-Match: "<etag>"          # Contrôle de concurrence optimiste
X-Update-Mode: "partial"    # ou "full" pour remplacement complet
```

## 📄 API Contracts

### GET /api/v1/hr/contracts
Liste des contrats avec filtres avancés.

**Query Parameters:**
```typescript
interface ContractFilters {
  employeeId?: string;
  type?: ContractType[];
  status?: ContractStatus[];
  departmentId?: string[];
  expiringWithin?: number;    // Jours
  salaryRange?: {
    min?: number;
    max?: number;
  };
  startDate?: DateRange;
  endDate?: DateRange;
  includeDocuments?: boolean;
}
```

### POST /api/v1/hr/contracts
Créer un nouveau contrat.

**Request Body:**
```typescript
interface CreateContractRequest {
  employeeId: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  positionId: string;
  salary: {
    amount: number;
    currency: string;
    frequency: 'monthly' | 'yearly' | 'hourly';
    bonuses?: Bonus[];
  };
  workingHours: {
    hoursPerWeek: number;
    schedule: WeeklySchedule;
    flexibility?: FlexibilityOptions;
  };
  benefits?: Benefit[];
  clauses?: ContractClause[];
  autoRenewal?: {
    enabled: boolean;
    duration?: number;        // Mois
    conditions?: string[];
  };
}
```

### POST /api/v1/hr/contracts/:id/renew
Renouveler un contrat.

**Request Body:**
```typescript
interface RenewContractRequest {
  newEndDate?: string;
  salaryIncrease?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  updatedBenefits?: Benefit[];
  updatedClauses?: ContractClause[];
  reason?: string;
}
```

## 🏖️ API Leaves

### GET /api/v1/hr/leaves
Liste des demandes de congés.

**Query Parameters:**
```typescript
interface LeaveFilters {
  employeeId?: string;
  managerId?: string;         // Congés des employés d'un manager
  departmentId?: string[];
  type?: LeaveType[];
  status?: LeaveStatus[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  requestedDateRange?: {      // Date de la demande
    start?: string;
    end?: string;
  };
  requiresApproval?: boolean; // Congés en attente d'approbation
  conflictsWith?: string;     // ID d'un employé pour vérifier les conflits
}
```

### POST /api/v1/hr/leaves
Créer une demande de congé.

**Request Body:**
```typescript
interface CreateLeaveRequest {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  medicalCertificate?: {
    filename: string;
    contentType: string;
    size: number;
    uploadToken: string;      // Token d'upload sécurisé
  };
  requestReplacement?: {
    preferredReplacements?: string[]; // IDs des employés préférés
    responsibilities: string[];
    criticalTasks: string[];
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}
```

**Response:**
```typescript
interface CreateLeaveResponse {
  data: Leave;
  workflow: {
    steps: ApprovalStep[];
    currentStep: number;
    estimatedCompletion: string;
  };
  impact: {
    workingDays: number;
    affectedProjects?: string[];
    suggestedReplacements?: {
      employeeId: string;
      competencyMatch: number;
      availability: 'full' | 'partial' | 'unavailable';
    }[];
  };
  warnings?: string[];
}
```

### POST /api/v1/hr/leaves/:id/approve
Approuver une demande de congé.

**Request Body:**
```typescript
interface ApproveLeaveRequest {
  approverComments?: string;
  conditions?: string[];      // Conditions d'approbation
  replacement?: {
    employeeId: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  };
  modifiedDates?: {          // Si modification des dates
    startDate: string;
    endDate: string;
    reason: string;
  };
}
```

## 📊 API Evaluations

### POST /api/v1/hr/evaluations
Créer une nouvelle évaluation.

**Request Body:**
```typescript
interface CreateEvaluationRequest {
  employeeId: string;
  evaluatorId: string;
  type: 'annual' | 'probation' | '360' | 'project' | 'disciplinary';
  period: {
    startDate: string;
    endDate: string;
  };
  objectives?: {
    carryover?: string[];     // IDs d'objectifs précédents
    new?: Partial<Objective>[];
  };
  competencies?: string[];    // IDs des compétences à évaluer
  includePatientFeedback?: boolean;
  deadline?: string;
}
```

### POST /api/v1/hr/evaluations/:id/360-review
Initier une évaluation 360°.

**Request Body:**
```typescript
interface Init360ReviewRequest {
  evaluators?: {
    peers?: string[];         // IDs des pairs sélectionnés
    subordinates?: string[];  // IDs des subordinates sélectionnés
    external?: {             // Évaluateurs externes
      name: string;
      email: string;
      relationship: string;
    }[];
  };
  includePatientFeedback?: boolean;
  customQuestions?: {
    category: string;
    questions: string[];
  }[];
  deadline: string;
  anonymous?: boolean;
}
```

## 📈 API Reports

### GET /api/v1/hr/reports/headcount
Rapport des effectifs.

**Query Parameters:**
```typescript
interface HeadcountReportParams {
  period: 'current' | 'historical';
  groupBy: 'department' | 'position' | 'contract_type' | 'status';
  dateRange?: {
    start: string;
    end: string;
    granularity: 'daily' | 'weekly' | 'monthly';
  };
  departments?: string[];
  includeForecasting?: boolean;
}
```

**Response:**
```typescript
interface HeadcountReport {
  data: {
    [key: string]: {
      current: number;
      hired: number;
      terminated: number;
      net: number;
      trend?: 'up' | 'down' | 'stable';
    };
  };
  summary: {
    totalCurrent: number;
    totalHired: number;
    totalTerminated: number;
    turnoverRate: number;
    growthRate: number;
  };
  forecasting?: {
    next3Months: number;
    next6Months: number;
    confidence: number;
  };
}
```

### GET /api/v1/hr/reports/performance
Rapport de performance globale.

## 🔒 Authentification et Autorisation

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;                // User ID
  employeeId?: string;        // Si l'utilisateur est un employé
  role: string[];             // Rôles de l'utilisateur
  permissions: string[];      // Permissions spécifiques
  departmentId?: string;      // Département de l'utilisateur
  iat: number;               // Issued at
  exp: number;               // Expiration
  aud: string;               // Audience
  iss: string;               // Issuer
}
```

### Permissions System
```typescript
const PERMISSIONS = {
  // Employés
  'employees:read': 'Lire les employés',
  'employees:write': 'Modifier les employés',
  'employees:delete': 'Supprimer les employés',
  'employees:read:own': 'Lire ses propres données',
  'employees:read:team': 'Lire les données de son équipe',
  
  // Contrats
  'contracts:read': 'Lire les contrats',
  'contracts:write': 'Modifier les contrats',
  'contracts:approve': 'Approuver les contrats',
  
  // Congés
  'leaves:read': 'Lire les congés',
  'leaves:write': 'Créer des demandes de congé',
  'leaves:approve': 'Approuver les congés',
  'leaves:read:team': 'Lire les congés de son équipe',
  
  // Évaluations
  'evaluations:read': 'Lire les évaluations',
  'evaluations:write': 'Créer des évaluations',
  'evaluations:conduct': 'Conduire des évaluations',
  
  // Reports
  'reports:headcount': 'Voir les rapports d\'effectifs',
  'reports:performance': 'Voir les rapports de performance',
  'reports:financial': 'Voir les rapports financiers',
} as const;
```

### Rate Limiting
```typescript
// Configuration par endpoint
const RATE_LIMITS = {
  '/api/v1/hr/employees': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 1000,                 // 1000 requêtes par fenêtre
  },
  '/api/v1/hr/reports/*': {
    windowMs: 60 * 60 * 1000,  // 1 heure
    max: 100,                  // 100 requêtes par heure
  },
  'POST /api/v1/hr/leaves': {
    windowMs: 24 * 60 * 60 * 1000, // 24 heures
    max: 50,                        // 50 créations de congés par jour
  },
};
```

## 🚨 Gestion d'Erreurs

### Structure des Erreurs
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      reason?: string;
      value?: any;
    }[];
    trace?: string;           // En développement seulement
  };
  meta: {
    requestId: string;
    timestamp: string;
    endpoint: string;
    method: string;
  };
}
```

### Codes d'Erreur Standards
```typescript
const ERROR_CODES = {
  // Authentification
  'AUTH_TOKEN_MISSING': 'Token d\'authentification manquant',
  'AUTH_TOKEN_INVALID': 'Token d\'authentification invalide',
  'AUTH_TOKEN_EXPIRED': 'Token d\'authentification expiré',
  'AUTH_INSUFFICIENT_PERMISSIONS': 'Permissions insuffisantes',
  
  // Validation
  'VALIDATION_FAILED': 'Échec de validation des données',
  'VALIDATION_REQUIRED_FIELD': 'Champ requis manquant',
  'VALIDATION_INVALID_FORMAT': 'Format de données invalide',
  'VALIDATION_DUPLICATE_VALUE': 'Valeur déjà existante',
  
  // Business Logic
  'EMPLOYEE_NOT_FOUND': 'Employé introuvable',
  'EMPLOYEE_ALREADY_EXISTS': 'Employé déjà existant',
  'CONTRACT_OVERLAP': 'Chevauchement de contrats',
  'LEAVE_BALANCE_INSUFFICIENT': 'Solde de congés insuffisant',
  'LEAVE_APPROVAL_REQUIRED': 'Approbation requise pour ce congé',
  
  // System
  'INTERNAL_SERVER_ERROR': 'Erreur interne du serveur',
  'SERVICE_UNAVAILABLE': 'Service temporairement indisponible',
  'RATE_LIMIT_EXCEEDED': 'Limite de taux dépassée',
} as const;
```

Cette spécification API garantit:
- ✅ APIs robustes et bien documentées
- ✅ Sécurité et authentification appropriées
- ✅ Gestion d'erreurs cohérente
- ✅ Performance optimisée avec cache
- ✅ Extensibilité pour futures fonctionnalités