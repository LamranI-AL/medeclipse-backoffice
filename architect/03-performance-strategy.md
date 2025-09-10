# Stratégie de Performance - Next.js avec PPR, SSR et Caching

## 🚀 Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 1.2s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 800ms
- **TTFB (Time to First Byte)**: < 200ms

### Business Metrics
- **Page Load Time**: < 2s sur réseau 3G
- **API Response Time**: < 150ms (P95)
- **Database Query Time**: < 50ms (P95)
- **Bundle Size**: < 200KB initial bundle

## 🎯 Partial Pre-rendering (PPR)

### Configuration Next.js
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental', // Enable PPR
    reactCompiler: true,
    turbo: {
      resolveAlias: {
        underscore: 'lodash',
        mocha: { browser: 'mocha/browser-entry.js' },
      },
    },
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};
```

### Implémentation PPR pour les Pages RH

#### Dashboard RH avec PPR
```typescript
// app/(dashboard)/hr/page.tsx
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';

export default async function HRDashboard() {
  // Partie statique (pré-rendue)
  return (
    <div>
      <Header />
      <Navigation />
      
      {/* Partie dynamique avec PPR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <DynamicMetrics />
        </Suspense>
        
        <Suspense fallback={<RecentActivitiesSkeleton />}>
          <RecentActivities />
        </Suspense>
        
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActions />
        </Suspense>
      </div>
    </div>
  );
}

// Composant dynamique qui utilise des données en temps réel
async function DynamicMetrics() {
  noStore(); // Indique à Next.js de ne pas mettre en cache
  
  const metrics = await getRealtimeMetrics();
  
  return (
    <div className="space-y-4">
      <MetricCard title="Employés Actifs" value={metrics.activeEmployees} />
      <MetricCard title="Congés Aujourd'hui" value={metrics.todayLeaves} />
      <MetricCard title="Nouveaux Contrats" value={metrics.newContracts} />
    </div>
  );
}
```

#### Page Liste Employés avec PPR
```typescript
// app/(dashboard)/hr/employees/page.tsx
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // Partie statique
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search || '';

  return (
    <div>
      <PageHeader title="Gestion des Employés" />
      
      {/* Composant de recherche statique */}
      <SearchForm defaultValue={search} />
      
      {/* Liste dynamique des employés */}
      <Suspense 
        key={`${page}-${search}`} 
        fallback={<EmployeesTableSkeleton />}
      >
        <EmployeesList page={page} search={search} />
      </Suspense>
    </div>
  );
}
```

## 🏗️ Server-Side Rendering Optimisé

### Stratégie de Rendu
```typescript
// Rendu côté serveur avec mise en cache
export async function generateStaticParams() {
  const departments = await getDepartments();
  return departments.map((dept) => ({ department: dept.slug }));
}

// ISR pour les données qui changent peu fréquemment
export const revalidate = 3600; // 1 heure

export default async function DepartmentPage({
  params,
}: {
  params: { department: string };
}) {
  const department = await getDepartmentDetails(params.department);
  
  return (
    <div>
      <DepartmentHeader department={department} />
      
      {/* Données statiques mises en cache */}
      <DepartmentStats department={department} />
      
      {/* Données dynamiques */}
      <Suspense fallback={<EmployeesListSkeleton />}>
        <DepartmentEmployees departmentId={department.id} />
      </Suspense>
    </div>
  );
}
```

### Optimisation des Data Fetching
```typescript
// lib/data-fetching.ts
export async function getEmployeesWithCache(
  filters: EmployeeFilters
): Promise<Employee[]> {
  const cacheKey = `employees:${JSON.stringify(filters)}`;
  
  return unstable_cache(
    async () => {
      const employees = await db.employee.findMany({
        where: buildWhereClause(filters),
        include: {
          department: true,
          contracts: {
            where: { status: 'active' },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      });
      return employees;
    },
    [cacheKey],
    {
      revalidate: 300, // 5 minutes
      tags: ['employees', `department:${filters.departmentId}`],
    }
  )();
}
```

## 💾 Stratégies de Cache Avancées

### Cache Multi-Niveaux

#### 1. Cache Navigateur
```typescript
// app/api/v1/hr/employees/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  const employees = await getEmployeesWithCache({
    page: parseInt(page),
    limit: 20,
  });
  
  return new Response(JSON.stringify(employees), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vary': 'Accept-Encoding',
    },
  });
}
```

#### 2. Cache Redis
```typescript
// infrastructure/cache/redis-cache.ts
export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = 300
  ): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Cache avec stratégie stale-while-revalidate
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300,
    staleTime: number = 600
  ): Promise<T> {
    const cached = await this.client.get(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      const { value, timestamp } = data;
      
      // Si les données sont fraîches, les retourner
      if (Date.now() - timestamp < ttl * 1000) {
        return value;
      }
      
      // Si les données sont stale mais pas expirées, les retourner
      // et déclencher une revalidation en arrière-plan
      if (Date.now() - timestamp < staleTime * 1000) {
        this.revalidateInBackground(key, fetcher, ttl);
        return value;
      }
    }
    
    // Sinon, récupérer de nouvelles données
    const freshData = await fetcher();
    await this.set(key, { value: freshData, timestamp: Date.now() }, staleTime);
    return freshData;
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const freshData = await fetcher();
      await this.set(key, { value: freshData, timestamp: Date.now() }, ttl);
    } catch (error) {
      console.error('Background revalidation failed:', error);
    }
  }
}
```

#### 3. Cache Base de Données
```typescript
// infrastructure/database/query-cache.ts
export class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async query<T>(
    sql: string,
    params: any[],
    ttl: number = 300
  ): Promise<T[]> {
    const cacheKey = this.generateCacheKey(sql, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data;
    }
    
    const result = await db.$queryRaw<T[]>`${sql}`;
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl,
    });
    
    return result;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private generateCacheKey(sql: string, params: any[]): string {
    return `query:${btoa(sql + JSON.stringify(params))}`;
  }
}
```

## ⚡ Optimisations Bundle et Assets

### Code Splitting Intelligent
```typescript
// app/(dashboard)/hr/employees/loading.tsx
export default function EmployeesLoading() {
  return <EmployeesTableSkeleton />;
}

// Dynamic imports pour les composants lourds
const AdvancedFilters = dynamic(
  () => import('@/presentation/components/employees/advanced-filters'),
  {
    loading: () => <FiltersSkeleton />,
    ssr: false, // Client-side only pour les interactions avancées
  }
);

const ExportModal = dynamic(
  () => import('@/presentation/components/employees/export-modal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);
```

### Optimisation des Images
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['medeclipse-assets.com'],
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
};

// lib/image-loader.ts
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  params.set('q', (quality || 75).toString());
  
  return `https://cdn.medeclipse.com/optimize?${params.toString()}`;
}
```

### Service Worker pour Cache Offline
```typescript
// public/sw.js
const CACHE_NAME = 'medeclipse-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/_next/static/css/app.css',
  '/_next/static/chunks/main.js',
];

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Servir depuis le cache et mettre à jour en arrière-plan
        fetch(event.request)
          .then((fetchResponse) => {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          })
          .catch(() => {});
        
        return cachedResponse;
      }
      
      return fetch(event.request);
    })
  );
});
```

## 📊 Monitoring et Analytics

### Performance Monitoring
```typescript
// lib/performance.ts
export function trackWebVitals(metric: NextWebVitalsMetric) {
  const { id, name, label, value } = metric;
  
  // Envoyer les métriques à un service d'analytics
  gtag('event', name, {
    event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    event_label: id,
    non_interaction: true,
  });
  
  // Log des métriques critiques
  if (name === 'LCP' && value > 2500) {
    console.warn(`LCP is slow: ${value}ms for ${id}`);
  }
}

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Cette stratégie de performance garantit:
- ✅ Temps de chargement < 1.2s
- ✅ Experience utilisateur fluide
- ✅ Cache intelligent multi-niveaux
- ✅ Optimisation automatique des assets
- ✅ Monitoring en temps réel