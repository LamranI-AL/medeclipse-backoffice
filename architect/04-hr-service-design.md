# Service RH - Design Complet

## 🎯 Vue d'ensemble du Service RH

Le service RH de MedEclipse est conçu comme un module autonome et extensible, gérant tous les aspects des ressources humaines dans un environnement médical.

## 👥 Modules Principaux

### 1. Gestion des Employés

#### Entité Employee
```typescript
// core/entities/employee.ts
export interface Employee {
  id: string;
  employeeNumber: string;
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
  medicalInfo: MedicalInfo;
  systemInfo: SystemInfo;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  dateOfBirth: Date;
  nationality: string;
  emergencyContact: EmergencyContact;
}

export interface ProfessionalInfo {
  position: Position;
  department: Department;
  specializations: Specialization[];
  certifications: Certification[];
  hireDate: Date;
  seniority: number;
  workSchedule: WorkSchedule;
}

export interface MedicalInfo {
  medicalLicenseNumber?: string;
  licenseExpiry?: Date;
  insuranceProfessional: string;
  vaccinations: Vaccination[];
  medicalExams: MedicalExam[];
}

export type EmployeeStatus = 
  | 'active' 
  | 'on_leave' 
  | 'suspended' 
  | 'terminated' 
  | 'retired';
```

#### Use Cases Employés
```typescript
// core/use-cases/employee/create-employee.ts
export class CreateEmployeeUseCase {
  constructor(
    private employeeRepository: EmployeeRepository,
    private employeeService: EmployeeService,
    private notificationService: NotificationService
  ) {}

  async execute(request: CreateEmployeeRequest): Promise<CreateEmployeeResponse> {
    // 1. Validation des données
    await this.validateEmployeeData(request);
    
    // 2. Vérification des doublons
    await this.checkForDuplicates(request.email, request.medicalLicenseNumber);
    
    // 3. Génération du numéro d'employé
    const employeeNumber = await this.generateEmployeeNumber(request.department);
    
    // 4. Création de l'employé
    const employee = await this.employeeService.createEmployee({
      ...request,
      employeeNumber,
    });
    
    // 5. Notifications
    await this.notificationService.notifyNewEmployee(employee);
    
    return {
      employee,
      message: 'Employé créé avec succès',
    };
  }

  private async validateEmployeeData(request: CreateEmployeeRequest): Promise<void> {
    const schema = EmployeeValidationSchema;
    const result = schema.safeParse(request);
    
    if (!result.success) {
      throw new ValidationError(result.error.errors);
    }
  }

  private async checkForDuplicates(email: string, licenseNumber?: string): Promise<void> {
    const existingByEmail = await this.employeeRepository.findByEmail(email);
    if (existingByEmail) {
      throw new DuplicateEmployeeError('email', email);
    }
    
    if (licenseNumber) {
      const existingByLicense = await this.employeeRepository.findByLicenseNumber(licenseNumber);
      if (existingByLicense) {
        throw new DuplicateEmployeeError('license', licenseNumber);
      }
    }
  }

  private async generateEmployeeNumber(departmentId: string): Promise<string> {
    const department = await this.employeeRepository.getDepartment(departmentId);
    const year = new Date().getFullYear();
    const sequence = await this.employeeRepository.getNextSequence(departmentId, year);
    
    return `${department.code}${year}${sequence.toString().padStart(4, '0')}`;
  }
}
```

### 2. Gestion des Contrats

#### Entité Contract
```typescript
// core/entities/contract.ts
export interface Contract {
  id: string;
  employeeId: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate?: Date;
  position: Position;
  salary: Salary;
  workingHours: WorkingHours;
  benefits: Benefit[];
  clauses: ContractClause[];
  documents: Document[];
  renewalHistory: ContractRenewal[];
  createdAt: Date;
  updatedAt: Date;
}

export type ContractType = 
  | 'permanent' 
  | 'temporary' 
  | 'internship' 
  | 'consultant' 
  | 'part_time';

export type ContractStatus = 
  | 'draft' 
  | 'pending_signature' 
  | 'active' 
  | 'suspended' 
  | 'terminated' 
  | 'expired';

export interface Salary {
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly' | 'hourly';
  bonuses: Bonus[];
  increases: SalaryIncrease[];
}

export interface WorkingHours {
  hoursPerWeek: number;
  schedule: WeeklySchedule;
  overtime: OvertimePolicy;
  flexibility: FlexibilityOptions;
}
```

#### Workflow de Renouvellement Automatique
```typescript
// core/use-cases/contract/auto-renewal-workflow.ts
export class AutoRenewalWorkflowUseCase {
  constructor(
    private contractRepository: ContractRepository,
    private employeeRepository: EmployeeRepository,
    private notificationService: NotificationService,
    private documentService: DocumentService
  ) {}

  async execute(): Promise<void> {
    // 1. Identifier les contrats qui expirent bientôt
    const expiringContracts = await this.contractRepository.findExpiringContracts(30); // 30 jours
    
    for (const contract of expiringContracts) {
      await this.processContractRenewal(contract);
    }
  }

  private async processContractRenewal(contract: Contract): Promise<void> {
    const employee = await this.employeeRepository.findById(contract.employeeId);
    
    // 2. Vérifier les critères de renouvellement automatique
    if (await this.isEligibleForAutoRenewal(contract, employee)) {
      await this.performAutoRenewal(contract);
    } else {
      await this.triggerManualReview(contract);
    }
  }

  private async isEligibleForAutoRenewal(
    contract: Contract, 
    employee: Employee
  ): Promise<boolean> {
    return (
      contract.type === 'permanent' &&
      employee.status === 'active' &&
      contract.clauses.some(clause => clause.type === 'auto_renewal') &&
      !await this.hasPendingDisciplinaryActions(employee.id)
    );
  }

  private async performAutoRenewal(contract: Contract): Promise<void> {
    // Créer le nouveau contrat
    const renewedContract = await this.contractRepository.create({
      ...contract,
      id: generateId(),
      startDate: contract.endDate!,
      endDate: new Date(contract.endDate!.getTime() + (365 * 24 * 60 * 60 * 1000)), // +1 an
      status: 'active',
    });

    // Mettre à jour l'ancien contrat
    await this.contractRepository.update(contract.id, {
      status: 'expired',
      renewalHistory: [
        ...contract.renewalHistory,
        {
          renewedAt: new Date(),
          newContractId: renewedContract.id,
          type: 'automatic',
        }
      ]
    });

    // Générer les documents
    await this.documentService.generateRenewalDocuments(renewedContract);

    // Notifications
    await this.notificationService.notifyContractRenewed(renewedContract);
  }
}
```

### 3. Gestion des Congés

#### Entité Leave
```typescript
// core/entities/leave.ts
export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
  medicalCertificate?: Document;
  replacement?: EmployeeReplacement;
  approvalWorkflow: ApprovalStep[];
  impact: LeaveImpact;
  createdAt: Date;
  updatedAt: Date;
}

export type LeaveType = 
  | 'annual' 
  | 'sick' 
  | 'maternity' 
  | 'paternity' 
  | 'emergency' 
  | 'unpaid' 
  | 'sabbatical' 
  | 'medical_extended';

export type LeaveStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'in_progress' 
  | 'completed';

export interface EmployeeReplacement {
  replacementEmployeeId: string;
  startDate: Date;
  endDate: Date;
  responsibilities: string[];
  status: 'assigned' | 'confirmed' | 'active' | 'completed';
}

export interface LeaveImpact {
  affectedProjects: string[];
  criticalTasks: string[];
  patientsAffected?: number;
  budgetImpact?: number;
}
```

#### Workflow d'Approbation Intelligent
```typescript
// core/use-cases/leave/smart-approval-workflow.ts
export class SmartApprovalWorkflowUseCase {
  constructor(
    private leaveRepository: LeaveRepository,
    private employeeRepository: EmployeeRepository,
    private workflowEngine: WorkflowEngine,
    private replacementService: ReplacementService
  ) {}

  async execute(leaveRequest: LeaveRequest): Promise<ApprovalWorkflow> {
    // 1. Analyser le contexte de la demande
    const context = await this.analyzeLeaveContext(leaveRequest);
    
    // 2. Déterminer le workflow d'approbation
    const workflow = await this.determineApprovalWorkflow(context);
    
    // 3. Rechercher des remplacements si nécessaire
    if (context.requiresReplacement) {
      workflow.steps.push(await this.createReplacementStep(leaveRequest));
    }
    
    // 4. Initier le workflow
    return await this.workflowEngine.initiate(workflow);
  }

  private async analyzeLeaveContext(request: LeaveRequest): Promise<LeaveContext> {
    const employee = await this.employeeRepository.findById(request.employeeId);
    const department = await this.employeeRepository.getDepartment(employee.departmentId);
    const conflictingLeaves = await this.leaveRepository.findConflicting(
      request.departmentId, 
      request.startDate, 
      request.endDate
    );

    return {
      employee,
      department,
      conflictingLeaves,
      isCriticalPeriod: await this.isCriticalPeriod(request.startDate, department),
      requiresReplacement: await this.requiresReplacement(employee, request.type),
      budgetImpact: await this.calculateBudgetImpact(request),
    };
  }

  private async determineApprovalWorkflow(context: LeaveContext): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      steps: [],
      parallelApprovals: false,
    };

    // Étape 1: Approbation hiérarchique
    workflow.steps.push({
      type: 'approval',
      approver: context.employee.managerId,
      autoApprove: this.shouldAutoApprove(context),
      timeout: 48, // heures
    });

    // Étape 2: Approbation RH (si nécessaire)
    if (context.requiresHRApproval) {
      workflow.steps.push({
        type: 'hr_approval',
        approver: 'hr_manager',
        timeout: 24,
      });
    }

    // Étape 3: Approbation direction (montants élevés ou absences longues)
    if (context.budgetImpact > 10000 || context.daysRequested > 30) {
      workflow.steps.push({
        type: 'executive_approval',
        approver: 'director',
        timeout: 72,
      });
    }

    return workflow;
  }

  private shouldAutoApprove(context: LeaveContext): boolean {
    return (
      context.employee.leaveBalance >= context.daysRequested &&
      !context.isCriticalPeriod &&
      context.conflictingLeaves.length === 0 &&
      context.daysRequested <= 5
    );
  }
}
```

### 4. Évaluations et Performance

#### Entité Evaluation
```typescript
// core/entities/evaluation.ts
export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  cycle: EvaluationCycle;
  period: EvaluationPeriod;
  status: EvaluationStatus;
  objectives: Objective[];
  competencies: CompetencyAssessment[];
  feedback: Feedback[];
  overallScore: number;
  recommendations: Recommendation[];
  developmentPlan: DevelopmentPlan;
  nextReviewDate: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  weight: number; // Pourcentage de l'évaluation totale
  target: ObjectiveTarget;
  achievement: ObjectiveAchievement;
  score: number; // 1-5
  comments: string;
}

export interface CompetencyAssessment {
  competencyId: string;
  name: string;
  category: 'technical' | 'behavioral' | 'leadership' | 'medical';
  currentLevel: number; // 1-5
  targetLevel: number; // 1-5
  evidence: string[];
  developmentNeeded: boolean;
}

export interface Feedback {
  type: '360' | 'manager' | 'peer' | 'subordinate' | 'patient';
  providerId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}
```

#### Système d'Évaluation 360°
```typescript
// core/use-cases/evaluation/360-evaluation.ts
export class Create360EvaluationUseCase {
  constructor(
    private evaluationRepository: EvaluationRepository,
    private employeeRepository: EmployeeRepository,
    private feedbackService: FeedbackService
  ) {}

  async execute(request: Create360EvaluationRequest): Promise<Evaluation> {
    // 1. Identifier les évaluateurs
    const evaluators = await this.identifyEvaluators(request.employeeId);
    
    // 2. Créer l'évaluation principale
    const evaluation = await this.evaluationRepository.create({
      employeeId: request.employeeId,
      evaluatorId: request.managerId,
      cycle: request.cycle,
      period: request.period,
      status: 'in_progress',
      objectives: await this.loadObjectives(request.employeeId, request.period),
      competencies: await this.loadCompetencies(request.employeeId),
    });

    // 3. Envoyer les demandes de feedback
    for (const evaluator of evaluators) {
      await this.feedbackService.requestFeedback({
        evaluationId: evaluation.id,
        evaluatorId: evaluator.id,
        type: evaluator.relationship,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      });
    }

    return evaluation;
  }

  private async identifyEvaluators(employeeId: string): Promise<Evaluator[]> {
    const employee = await this.employeeRepository.findById(employeeId);
    const evaluators: Evaluator[] = [];

    // Manager direct
    if (employee.managerId) {
      evaluators.push({
        id: employee.managerId,
        relationship: 'manager',
        weight: 0.4, // 40% du score final
      });
    }

    // Pairs (collègues du même niveau)
    const peers = await this.employeeRepository.findPeers(employeeId);
    const selectedPeers = this.selectRandomEvaluators(peers, 3);
    evaluators.push(...selectedPeers.map(peer => ({
      id: peer.id,
      relationship: 'peer' as const,
      weight: 0.3 / selectedPeers.length,
    })));

    // Subordinates (si manager)
    const subordinates = await this.employeeRepository.findSubordinates(employeeId);
    if (subordinates.length > 0) {
      const selectedSubordinates = this.selectRandomEvaluators(subordinates, 2);
      evaluators.push(...selectedSubordinates.map(sub => ({
        id: sub.id,
        relationship: 'subordinate' as const,
        weight: 0.2 / selectedSubordinates.length,
      })));
    }

    // Patients (pour le personnel médical)
    if (employee.position.category === 'medical') {
      evaluators.push({
        id: 'patient_feedback_system',
        relationship: 'patient',
        weight: 0.1,
      });
    }

    return evaluators;
  }
}
```

## 🚀 APIs RESTful

### Structure des APIs
```
/api/v1/hr/
├── employees/
│   ├── GET /           # Liste des employés (avec filtres)
│   ├── POST /          # Créer un employé
│   ├── GET /:id        # Détails d'un employé
│   ├── PUT /:id        # Mettre à jour un employé
│   ├── DELETE /:id     # Supprimer un employé
│   ├── GET /:id/contracts      # Contrats d'un employé
│   ├── GET /:id/leaves         # Congés d'un employé
│   ├── GET /:id/evaluations    # Évaluations d'un employé
│   └── POST /:id/upload-photo  # Upload photo de profil
├── contracts/
│   ├── GET /           # Liste des contrats
│   ├── POST /          # Créer un contrat
│   ├── GET /:id        # Détails d'un contrat
│   ├── PUT /:id        # Mettre à jour un contrat
│   ├── POST /:id/renew # Renouveler un contrat
│   ├── POST /:id/terminate     # Résilier un contrat
│   └── GET /:id/documents      # Documents contractuels
├── leaves/
│   ├── GET /           # Liste des congés
│   ├── POST /          # Créer une demande de congé
│   ├── GET /:id        # Détails d'un congé
│   ├── PUT /:id        # Mettre à jour un congé
│   ├── POST /:id/approve       # Approuver un congé
│   ├── POST /:id/reject        # Rejeter un congé
│   └── GET /:id/replacements   # Remplacements pour un congé
├── evaluations/
│   ├── GET /           # Liste des évaluations
│   ├── POST /          # Créer une évaluation
│   ├── GET /:id        # Détails d'une évaluation
│   ├── PUT /:id        # Mettre à jour une évaluation
│   ├── POST /:id/submit        # Soumettre une évaluation
│   ├── GET /:id/feedback       # Feedback d'une évaluation
│   └── POST /:id/360-review    # Initier une évaluation 360°
└── reports/
    ├── GET /headcount          # Effectifs par département
    ├── GET /turnover           # Taux de rotation
    ├── GET /leave-balance      # Soldes de congés
    └── GET /performance        # Rapport de performance
```

### Exemple d'implémentation API
```typescript
// app/api/v1/hr/employees/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      department: searchParams.get('department'),
      status: searchParams.get('status'),
      position: searchParams.get('position'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search'),
    };

    const getEmployeesUseCase = container.resolve<GetEmployeesUseCase>('GetEmployeesUseCase');
    const result = await getEmployeesUseCase.execute(filters);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Total-Count': result.total.toString(),
        'X-Page': result.page.toString(),
        'X-Per-Page': result.limit.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const createEmployeeUseCase = container.resolve<CreateEmployeeUseCase>('CreateEmployeeUseCase');
    const result = await createEmployeeUseCase.execute(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## 📊 Modèle de Données

### Relations et Contraintes
```sql
-- Base de données PostgreSQL optimisée

-- Table des employés
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    status employee_status DEFAULT 'active',
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    manager_id UUID REFERENCES employees(id),
    medical_license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_search ON employees USING gin(
    to_tsvector('french', first_name || ' ' || last_name || ' ' || email)
);

-- Table des contrats
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type contract_type NOT NULL,
    status contract_status DEFAULT 'draft',
    start_date DATE NOT NULL,
    end_date DATE,
    position_id UUID REFERENCES positions(id),
    salary_amount DECIMAL(10,2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    working_hours INTEGER DEFAULT 35,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes métier
ALTER TABLE contracts ADD CONSTRAINT check_contract_dates 
    CHECK (end_date IS NULL OR start_date < end_date);
ALTER TABLE contracts ADD CONSTRAINT check_salary_positive 
    CHECK (salary_amount > 0);

-- Table des congés
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type leave_type NOT NULL,
    status leave_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    replacement_employee_id UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes métier pour les congés
ALTER TABLE leaves ADD CONSTRAINT check_leave_dates 
    CHECK (start_date <= end_date);
ALTER TABLE leaves ADD CONSTRAINT check_leave_days 
    CHECK (days > 0 AND days <= 365);
```

Ce design du service RH assure:
- ✅ Gestion complète du cycle de vie des employés
- ✅ Workflows automatisés intelligents
- ✅ APIs robustes et bien documentées
- ✅ Modèle de données optimisé
- ✅ Extensibilité pour les futurs besoins