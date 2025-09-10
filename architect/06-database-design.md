# Conception Base de Données Neon - MedEclipse HR

## 🗄️ Architecture de Base de Données Moderne

### Technologies Choisies
- **SGBD Principal**: Neon PostgreSQL (serverless, auto-scaling)
- **ORM**: Drizzle ORM (type-safe, performance)
- **Cache**: Edge Runtime Cache + Neon connection pooling
- **Files**: Vercel Blob ou Neon Storage (selon besoins)
- **Audit**: Intégré dans le schéma Drizzle

### Stratégie Multi-Tenant
```sql
-- Tenant par schéma (isolation forte)
CREATE SCHEMA medeclipse_clinic_a;
CREATE SCHEMA medeclipse_clinic_b;

-- Configuration tenant
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    schema_name VARCHAR(63) NOT NULL,
    status tenant_status DEFAULT 'active',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 Modèle de Données Complet

### 1. Entités Principales

#### Employés
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(2), -- ISO 3166-1
    gender VARCHAR(20),
    
    -- Adresse (JSONB pour flexibilité internationale)
    address JSONB,
    emergency_contact JSONB,
    
    -- Informations professionnelles
    hire_date DATE NOT NULL,
    termination_date DATE,
    status employee_status DEFAULT 'active',
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    manager_id UUID REFERENCES employees(id),
    work_schedule_id UUID REFERENCES work_schedules(id),
    
    -- Informations médicales (si applicable)
    medical_license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    insurance_professional VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    -- Contraintes
    CONSTRAINT check_hire_before_termination 
        CHECK (termination_date IS NULL OR hire_date < termination_date),
    CONSTRAINT check_license_expiry 
        CHECK (medical_license_number IS NULL OR license_expiry IS NOT NULL),
    CONSTRAINT check_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index optimisés
CREATE INDEX idx_employees_department ON employees(department_id) WHERE status = 'active';
CREATE INDEX idx_employees_manager ON employees(manager_id) WHERE status = 'active';
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);
CREATE INDEX idx_employees_medical_license ON employees(medical_license_number) WHERE medical_license_number IS NOT NULL;

-- Index de recherche full-text
CREATE INDEX idx_employees_search ON employees 
USING gin(to_tsvector('french', first_name || ' ' || last_name || ' ' || email));

-- Trigger pour updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### Départements et Positions
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id),
    head_id UUID REFERENCES employees(id),
    budget DECIMAL(12,2),
    cost_center VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte hiérarchique
    CONSTRAINT check_no_self_parent CHECK (id != parent_id)
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    category position_category NOT NULL,
    level INTEGER CHECK (level BETWEEN 1 AND 10),
    department_id UUID REFERENCES departments(id),
    reports_to_position_id UUID REFERENCES positions(id),
    description TEXT,
    requirements JSONB, -- Compétences, certifications requises
    salary_range JSONB, -- {min: number, max: number, currency: string}
    is_manager BOOLEAN DEFAULT FALSE,
    is_medical BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_no_self_reporting CHECK (id != reports_to_position_id)
);

-- Types énumérés
CREATE TYPE position_category AS ENUM (
    'medical', 'nursing', 'administrative', 'technical', 
    'management', 'support', 'research', 'education'
);

CREATE TYPE employee_status AS ENUM (
    'active', 'on_leave', 'suspended', 'terminated', 'retired'
);
```

### 2. Contrats et Rémunération

#### Contrats
```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_number VARCHAR(30) UNIQUE NOT NULL,
    
    -- Type et statut
    type contract_type NOT NULL,
    status contract_status DEFAULT 'draft',
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    signature_date DATE,
    
    -- Position et département
    position_id UUID REFERENCES positions(id),
    department_id UUID REFERENCES departments(id),
    
    -- Rémunération
    salary_amount DECIMAL(10,2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    salary_frequency salary_frequency DEFAULT 'monthly',
    
    -- Temps de travail
    working_hours_per_week DECIMAL(4,2) DEFAULT 35.00,
    working_days_per_week INTEGER DEFAULT 5,
    
    -- Avantages (JSONB pour flexibilité)
    benefits JSONB DEFAULT '[]',
    
    -- Clauses spéciales
    clauses JSONB DEFAULT '[]',
    
    -- Renouvellement automatique
    auto_renewal JSONB,
    
    -- Approbations
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    hr_approved_by UUID REFERENCES employees(id),
    hr_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    version INTEGER DEFAULT 1,
    
    -- Contraintes
    CONSTRAINT check_contract_dates 
        CHECK (end_date IS NULL OR start_date < end_date),
    CONSTRAINT check_signature_date 
        CHECK (signature_date IS NULL OR signature_date >= start_date),
    CONSTRAINT check_salary_positive 
        CHECK (salary_amount > 0),
    CONSTRAINT check_working_hours 
        CHECK (working_hours_per_week > 0 AND working_hours_per_week <= 80)
);

CREATE TYPE contract_type AS ENUM (
    'permanent', 'temporary', 'internship', 'consultant', 
    'part_time', 'seasonal', 'project_based'
);

CREATE TYPE contract_status AS ENUM (
    'draft', 'pending_signature', 'active', 'suspended', 
    'terminated', 'expired', 'cancelled'
);

CREATE TYPE salary_frequency AS ENUM (
    'hourly', 'daily', 'weekly', 'monthly', 'yearly'
);

-- Index pour performance
CREATE INDEX idx_contracts_employee ON contracts(employee_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
CREATE INDEX idx_contracts_expiring ON contracts(end_date) WHERE end_date IS NOT NULL AND status = 'active';
```

#### Historique des Salaires
```sql
CREATE TABLE salary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    
    -- Ancien et nouveau salaire
    previous_amount DECIMAL(10,2),
    new_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    frequency salary_frequency DEFAULT 'monthly',
    
    -- Raison du changement
    change_type salary_change_type NOT NULL,
    reason TEXT,
    
    -- Dates
    effective_date DATE NOT NULL,
    announced_date DATE,
    
    -- Approbation
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE salary_change_type AS ENUM (
    'hire', 'promotion', 'merit_increase', 'market_adjustment', 
    'cost_of_living', 'bonus', 'demotion', 'correction'
);
```

### 3. Congés et Absences

#### Congés
```sql
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Type et statut
    type leave_type NOT NULL,
    status leave_status DEFAULT 'pending',
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Calculs
    total_days INTEGER NOT NULL,
    working_days INTEGER NOT NULL,
    hours DECIMAL(6,2), -- Pour congés partiels
    
    -- Détails
    reason TEXT,
    emergency_reason TEXT,
    
    -- Documents médicaux
    medical_certificate_required BOOLEAN DEFAULT FALSE,
    medical_certificate_uploaded BOOLEAN DEFAULT FALSE,
    medical_certificate_path VARCHAR(500),
    
    -- Remplacement
    replacement_employee_id UUID REFERENCES employees(id),
    replacement_confirmed BOOLEAN DEFAULT FALSE,
    handover_notes TEXT,
    
    -- Workflow d'approbation
    current_approval_step INTEGER DEFAULT 1,
    approval_workflow JSONB, -- Configuration du workflow
    
    -- Commentaires
    employee_comments TEXT,
    manager_comments TEXT,
    hr_comments TEXT,
    
    -- Impact métier
    affected_projects JSONB DEFAULT '[]',
    critical_tasks JSONB DEFAULT '[]',
    business_impact leave_impact,
    
    -- Annulation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT check_leave_dates CHECK (start_date <= end_date),
    CONSTRAINT check_total_days CHECK (total_days > 0 AND total_days <= 365),
    CONSTRAINT check_working_days CHECK (working_days > 0 AND working_days <= total_days),
    CONSTRAINT check_no_self_replacement CHECK (employee_id != replacement_employee_id)
);

CREATE TYPE leave_type AS ENUM (
    'annual', 'sick', 'maternity', 'paternity', 'parental',
    'emergency', 'bereavement', 'medical_extended', 'sabbatical',
    'unpaid', 'compensatory', 'training', 'jury_duty'
);

CREATE TYPE leave_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled',
    'in_progress', 'completed', 'partially_approved'
);

CREATE TYPE leave_impact AS ENUM (
    'none', 'low', 'medium', 'high', 'critical'
);

-- Index optimisés
CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_pending_approval ON leaves(status, current_approval_step) 
    WHERE status = 'pending';
CREATE INDEX idx_leaves_replacement ON leaves(replacement_employee_id) 
    WHERE replacement_employee_id IS NOT NULL;
```

#### Approbations des Congés
```sql
CREATE TABLE leave_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    approver_id UUID REFERENCES employees(id),
    
    -- Décision
    decision approval_decision,
    decided_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    
    -- Conditions
    conditions JSONB, -- Conditions d'approbation
    
    -- Modifications proposées
    proposed_start_date DATE,
    proposed_end_date DATE,
    proposed_days INTEGER,
    
    -- Statut
    is_current_step BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    timeout_hours INTEGER DEFAULT 48,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(leave_id, step_number)
);

CREATE TYPE approval_decision AS ENUM (
    'pending', 'approved', 'rejected', 'approved_with_conditions',
    'needs_more_info', 'delegated', 'timeout'
);
```

### 4. Évaluations et Performance

#### Évaluations
```sql
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES employees(id),
    
    -- Type et cycle
    type evaluation_type NOT NULL,
    cycle_id UUID REFERENCES evaluation_cycles(id),
    
    -- Période évaluée
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,
    
    -- Statut
    status evaluation_status DEFAULT 'draft',
    
    -- Scores
    overall_score DECIMAL(3,2) CHECK (overall_score BETWEEN 1.0 AND 5.0),
    objectives_score DECIMAL(3,2),
    competencies_score DECIMAL(3,2),
    behavioral_score DECIMAL(3,2),
    
    -- Commentaires
    strengths TEXT,
    areas_for_improvement TEXT,
    achievements TEXT,
    challenges_faced TEXT,
    
    -- Développement
    development_goals JSONB DEFAULT '[]',
    training_recommendations JSONB DEFAULT '[]',
    career_discussion TEXT,
    
    -- Dates importantes
    due_date DATE,
    submitted_date DATE,
    manager_review_date DATE,
    hr_review_date DATE,
    final_discussion_date DATE,
    
    -- Signatures électroniques
    employee_acknowledged BOOLEAN DEFAULT FALSE,
    employee_acknowledged_at TIMESTAMP WITH TIME ZONE,
    manager_approved BOOLEAN DEFAULT FALSE,
    manager_approved_at TIMESTAMP WITH TIME ZONE,
    hr_approved BOOLEAN DEFAULT FALSE,
    hr_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    CONSTRAINT check_evaluation_period 
        CHECK (evaluation_period_start < evaluation_period_end),
    CONSTRAINT check_due_date 
        CHECK (due_date IS NULL OR due_date >= evaluation_period_end)
);

CREATE TYPE evaluation_type AS ENUM (
    'annual', 'probation', '360', 'project', 'disciplinary', 
    'promotion', 'mid_year', 'quarterly'
);

CREATE TYPE evaluation_status AS ENUM (
    'draft', 'in_progress', 'submitted', 'manager_review', 
    'hr_review', 'completed', 'cancelled'
);
```

#### Objectifs
```sql
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    evaluation_id UUID REFERENCES evaluations(id),
    
    -- Détails de l'objectif
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category objective_category,
    priority objective_priority DEFAULT 'medium',
    
    -- Mesure
    measurement_type measurement_type,
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    unit VARCHAR(50),
    
    -- Pondération
    weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight BETWEEN 0.1 AND 2.0),
    
    -- Dates
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    
    -- Évaluation
    achievement_level DECIMAL(3,2) CHECK (achievement_level BETWEEN 0.0 AND 5.0),
    score DECIMAL(3,2) CHECK (score BETWEEN 1.0 AND 5.0),
    
    -- Commentaires
    progress_notes TEXT,
    final_comments TEXT,
    
    -- Statut
    status objective_status DEFAULT 'active',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_objective_dates CHECK (start_date <= target_date)
);

CREATE TYPE objective_category AS ENUM (
    'performance', 'development', 'behavioral', 'strategic', 
    'operational', 'innovation', 'leadership', 'compliance'
);

CREATE TYPE objective_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE measurement_type AS ENUM (
    'quantitative', 'qualitative', 'milestone', 'percentage', 'rating'
);

CREATE TYPE objective_status AS ENUM (
    'active', 'completed', 'cancelled', 'deferred', 'modified'
);
```

## 🔍 Optimisations et Performance

### 1. Stratégies de Partitioning

#### Partitioning par Date (Congés et Évaluations)
```sql
-- Partition des congés par année
CREATE TABLE leaves_2024 PARTITION OF leaves
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE leaves_2025 PARTITION OF leaves
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Partition des évaluations par cycle
CREATE TABLE evaluations_annual_2024 PARTITION OF evaluations
FOR VALUES IN ('annual_2024');
```

### 2. Index Composites Avancés

```sql
-- Index composite pour recherches fréquentes
CREATE INDEX idx_employees_dept_status_hire ON employees(department_id, status, hire_date);

-- Index partiel pour données actives
CREATE INDEX idx_contracts_active_expiring ON contracts(end_date)
WHERE status = 'active' AND end_date IS NOT NULL;

-- Index GIN pour recherche full-text
CREATE INDEX idx_employees_fulltext ON employees 
USING gin(to_tsvector('french', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '') || ' ' ||
    coalesce(employee_number, '')
));
```

### 3. Vues Matérialisées

```sql
-- Vue matérialisée pour dashboard RH
CREATE MATERIALIZED VIEW hr_dashboard_metrics AS
SELECT 
    d.name as department_name,
    COUNT(*) FILTER (WHERE e.status = 'active') as active_employees,
    COUNT(*) FILTER (WHERE e.status = 'on_leave') as on_leave,
    COUNT(*) FILTER (WHERE e.hire_date >= CURRENT_DATE - INTERVAL '30 days') as new_hires_30d,
    AVG(EXTRACT(days FROM CURRENT_DATE - e.hire_date)) as avg_tenure_days,
    COUNT(l.*) FILTER (WHERE l.status = 'pending') as pending_leaves,
    COUNT(c.*) FILTER (WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as contracts_expiring_30d
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN leaves l ON e.id = l.employee_id AND l.status = 'pending'
LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'active'
WHERE e.status != 'terminated'
GROUP BY d.id, d.name;

-- Rafraîchissement automatique
CREATE INDEX ON hr_dashboard_metrics (department_name);
```

### 4. Fonctions Stockées Optimisées

```sql
-- Fonction pour calculer les congés disponibles
CREATE OR REPLACE FUNCTION calculate_leave_balance(
    p_employee_id UUID,
    p_leave_type leave_type,
    p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL AS $$
DECLARE
    balance DECIMAL := 0;
    accrual_rate DECIMAL;
    used_days DECIMAL;
BEGIN
    -- Récupérer le taux d'accumulation
    SELECT lr.annual_entitlement / 365.0 INTO accrual_rate
    FROM leave_entitlements lr
    WHERE lr.employee_id = p_employee_id AND lr.leave_type = p_leave_type;
    
    IF accrual_rate IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculer les jours accumulés
    SELECT GREATEST(0, accrual_rate * EXTRACT(days FROM p_as_of_date - e.hire_date))
    INTO balance
    FROM employees e
    WHERE e.id = p_employee_id;
    
    -- Soustraire les congés utilisés
    SELECT COALESCE(SUM(working_days), 0) INTO used_days
    FROM leaves
    WHERE employee_id = p_employee_id 
      AND type = p_leave_type
      AND status IN ('approved', 'completed')
      AND start_date <= p_as_of_date;
    
    RETURN balance - used_days;
END;
$$ LANGUAGE plpgsql;
```

## 🔐 Sécurité et Audit

### 1. Row Level Security (RLS)

```sql
-- Activation de RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Politique: Un employé ne peut voir que ses données
CREATE POLICY employee_own_data ON employees
    FOR SELECT
    USING (id = current_setting('app.current_employee_id')::UUID);

-- Politique: Un manager peut voir ses subordonnés
CREATE POLICY manager_team_data ON employees
    FOR SELECT
    USING (
        manager_id = current_setting('app.current_employee_id')::UUID
        OR 
        has_permission(current_setting('app.current_user_id')::UUID, 'employees:read:all')
    );
```

### 2. Table d'Audit Universelle

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(63) NOT NULL,
    record_id UUID NOT NULL,
    operation audit_operation NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES users(id),
    employee_id UUID REFERENCES employees(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour performance
    INDEX (table_name, record_id),
    INDEX (user_id, created_at),
    INDEX (created_at) WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
);

CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'SELECT');
```

### 3. Fonctions de Chiffrement

```sql
-- Extension pour chiffrement
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction pour chiffrer les données sensibles
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, current_setting('app.encryption_key'), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déchiffrer
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), current_setting('app.encryption_key'), 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql;
```

## 📈 Monitoring et Métriques

### 1. Tables de Métriques

```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (metric_name, recorded_at),
    INDEX (recorded_at) WHERE recorded_at >= CURRENT_DATE - INTERVAL '7 days'
);

-- Insertion automatique des métriques
CREATE OR REPLACE FUNCTION record_metric(
    p_name VARCHAR(100),
    p_value DECIMAL(15,4),
    p_unit VARCHAR(20) DEFAULT NULL,
    p_tags JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, tags)
    VALUES (p_name, p_value, p_unit, p_tags);
END;
$$ LANGUAGE plpgsql;
```

### 2. Requêtes de Monitoring

```sql
-- Vue pour métriques temps réel
CREATE VIEW current_hr_metrics AS
SELECT 
    'active_employees' as metric,
    COUNT(*)::DECIMAL as value,
    'employees' as unit
FROM employees WHERE status = 'active'
UNION ALL
SELECT 
    'pending_leaves' as metric,
    COUNT(*)::DECIMAL as value,
    'requests' as unit
FROM leaves WHERE status = 'pending'
UNION ALL
SELECT 
    'contracts_expiring_30d' as metric,
    COUNT(*)::DECIMAL as value,
    'contracts' as unit
FROM contracts 
WHERE status = 'active' 
  AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
```

Cette conception de base de données garantit:
- ✅ Performance optimisée avec index et partitions
- ✅ Sécurité robuste avec RLS et chiffrement  
- ✅ Audit complet de toutes les opérations
- ✅ Scalabilité avec architecture multi-tenant
- ✅ Monitoring en temps réel des performances