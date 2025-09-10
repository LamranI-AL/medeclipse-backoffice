# Bibliothèque de Composants - shadcn/ui + MedEclipse

## 🎨 Stratégie de Design System

### Philosophie Design
- **Cohérence**: Composants uniformes dans toute l'application
- **Accessibilité**: WCAG 2.1 AA compliance native
- **Performance**: Composants optimisés et tree-shakable
- **Flexibilité**: Customisation facile selon les besoins métier
- **Évolutivité**: Extensible pour les futures fonctionnalités

### Base shadcn/ui
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-calendar": "^1.0.6",
    "@radix-ui/react-card": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-form": "^0.0.3",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

## 🏗️ Structure des Composants

### Organisation des Fichiers
```
presentation/components/
├── ui/                              # Composants shadcn/ui de base
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   └── toast.tsx
├── business/                        # Composants métier MedEclipse
│   ├── employee/
│   │   ├── employee-card.tsx
│   │   ├── employee-form.tsx
│   │   ├── employee-list.tsx
│   │   ├── employee-search.tsx
│   │   └── employee-status-badge.tsx
│   ├── contracts/
│   │   ├── contract-card.tsx
│   │   ├── contract-form.tsx
│   │   ├── contract-timeline.tsx
│   │   └── contract-status.tsx
│   ├── leaves/
│   │   ├── leave-calendar.tsx
│   │   ├── leave-form.tsx
│   │   ├── leave-approval-flow.tsx
│   │   └── leave-balance-card.tsx
│   └── evaluations/
│       ├── evaluation-form.tsx
│       ├── objective-card.tsx
│       ├── competency-radar.tsx
│       └── feedback-360.tsx
├── layout/                          # Composants de mise en page
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── navigation.tsx
│   ├── breadcrumb.tsx
│   ├── page-header.tsx
│   └── footer.tsx
├── charts/                          # Composants de graphiques
│   ├── line-chart.tsx
│   ├── bar-chart.tsx
│   ├── pie-chart.tsx
│   ├── radar-chart.tsx
│   └── metric-card.tsx
├── forms/                           # Composants de formulaires
│   ├── form-builder.tsx
│   ├── field-wrapper.tsx
│   ├── validation-message.tsx
│   ├── file-upload.tsx
│   └── date-range-picker.tsx
└── common/                          # Composants communs
    ├── data-table.tsx
    ├── loading-spinner.tsx
    ├── empty-state.tsx
    ├── error-boundary.tsx
    ├── confirmation-modal.tsx
    └── search-combobox.tsx
```

## 🎯 Composants Métier Spécifiques

### 1. Composants Employés

#### EmployeeCard
```typescript
// presentation/components/business/employee/employee-card.tsx
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/presentation/components/ui/avatar';
import { Button } from '@/presentation/components/ui/button';
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Edit,
  Eye 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';

interface EmployeeCardProps {
  employee: Employee;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onStatusChange?: (employee: Employee, status: EmployeeStatus) => void;
}

export function EmployeeCard({
  employee,
  variant = 'default',
  showActions = true,
  onView,
  onEdit,
  onStatusChange,
}: EmployeeCardProps) {
  const getStatusColor = (status: EmployeeStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800',
      retired: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || colors.active;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (variant === 'compact') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee.photoUrl} />
            <AvatarFallback>
              {getInitials(employee.personalInfo.firstName, employee.personalInfo.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {employee.personalInfo.firstName} {employee.personalInfo.lastName}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {employee.professionalInfo.position.title}
            </p>
          </div>
          <Badge variant="secondary" className={getStatusColor(employee.status)}>
            {employee.status}
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.photoUrl} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getInitials(employee.personalInfo.firstName, employee.personalInfo.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {employee.professionalInfo.position.title}
              </p>
              <p className="text-xs text-muted-foreground">
                #{employee.employeeNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(employee)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir le profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(employee)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      {variant === 'detailed' && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" />
                {employee.personalInfo.email}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                {employee.personalInfo.phone}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Embauché le {new Date(employee.professionalInfo.hireDate).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                {employee.professionalInfo.department.name}
              </div>
            </div>
          </div>

          {employee.professionalInfo.specializations && employee.professionalInfo.specializations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Spécialisations</h4>
              <div className="flex flex-wrap gap-1">
                {employee.professionalInfo.specializations.map((spec) => (
                  <Badge key={spec.id} variant="outline" className="text-xs">
                    {spec.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
```

#### EmployeeForm avec Validation
```typescript
// presentation/components/business/employee/employee-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/presentation/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Calendar } from '@/presentation/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/presentation/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const employeeFormSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(10, 'Numéro de téléphone invalide'),
    dateOfBirth: z.date({
      required_error: 'La date de naissance est requise',
    }),
    nationality: z.string().optional(),
    address: z.object({
      street: z.string().min(5, 'Adresse trop courte'),
      city: z.string().min(2, 'Ville requise'),
      postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
      country: z.string().default('FR'),
    }),
    emergencyContact: z.object({
      name: z.string().min(2, 'Nom du contact d\'urgence requis'),
      relationship: z.string().min(2, 'Relation requise'),
      phone: z.string().min(10, 'Téléphone du contact d\'urgence requis'),
      email: z.string().email().optional().or(z.literal('')),
    }),
  }),
  professionalInfo: z.object({
    positionId: z.string().min(1, 'Poste requis'),
    departmentId: z.string().min(1, 'Département requis'),
    managerId: z.string().optional(),
    hireDate: z.date({
      required_error: 'Date d\'embauche requise',
    }),
    workScheduleId: z.string().min(1, 'Horaire de travail requis'),
    specializations: z.array(z.string()).optional(),
  }),
  medicalInfo: z.object({
    medicalLicenseNumber: z.string().optional(),
    licenseExpiry: z.date().optional(),
    insuranceProfessional: z.string().optional(),
  }).optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  departments: Department[];
  positions: Position[];
  workSchedules: WorkSchedule[];
  managers: Employee[];
}

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  departments,
  positions,
  workSchedules,
  managers,
}: EmployeeFormProps) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: initialData || {
      personalInfo: {
        nationality: 'FR',
        address: { country: 'FR' },
        emergencyContact: {},
      },
      professionalInfo: {
        specializations: [],
      },
      medicalInfo: {},
    },
  });

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Section Informations Personnelles */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium">Informations Personnelles</h3>
            <p className="text-sm text-muted-foreground">
              Détails personnels de l'employé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personalInfo.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jean.dupont@medeclipse.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input placeholder="01 23 45 67 89" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de naissance *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationalité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une nationalité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FR">Française</SelectItem>
                      <SelectItem value="BE">Belge</SelectItem>
                      <SelectItem value="CH">Suisse</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section Informations Professionnelles */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium">Informations Professionnelles</h3>
            <p className="text-sm text-muted-foreground">
              Détails du poste et de l'organisation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="professionalInfo.departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professionalInfo.positionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poste *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un poste" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professionalInfo.managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun manager</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.personalInfo.firstName} {manager.personalInfo.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professionalInfo.hireDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'embauche *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 2. Composants de Données

#### DataTable Générique
```typescript
// presentation/components/common/data-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Rechercher...",
  onRowClick,
  loading = false,
  error,
  emptyMessage = "Aucune donnée disponible",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
        </div>
        
        {/* Sélection des colonnes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tableau */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} sur{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 Thème et Personnalisation

### Configuration Tailwind
```javascript
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./presentation/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Couleurs MedEclipse
        medical: {
          50: "#f0f9ff",
          100: "#e0f2fe", 
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
        },
        // shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### Variables CSS Personnalisées
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Couleurs principales */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    /* Couleurs primaires MedEclipse */
    --primary: 200 98% 39%;
    --primary-foreground: 210 40% 98%;
    
    /* Couleurs secondaires */
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    
    /* Couleurs système */
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    /* Bordures et inputs */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 200 98% 39%;
    
    /* Border radius */
    --radius: 0.5rem;
    
    /* Métriques spécifiques MedEclipse */
    --medical-success: 142 76% 36%;
    --medical-warning: 38 92% 50%;
    --medical-danger: 0 84% 60%;
    --medical-info: 200 98% 39%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 200 98% 39%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 200 98% 39%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* Composants personnalisés MedEclipse */
  .medical-card {
    @apply bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200;
  }
  
  .status-badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }
  
  .status-active {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
  }
  
  .status-inactive {
    @apply bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200;
  }
  
  .status-pending {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
  }
  
  .status-danger {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
  }
}
```

Cette bibliothèque de composants garantit:
- ✅ Cohérence visuelle dans toute l'application
- ✅ Accessibilité native (WCAG 2.1 AA)
- ✅ Performance optimisée avec tree-shaking
- ✅ Thème sombre/clair automatique
- ✅ Composants métier réutilisables