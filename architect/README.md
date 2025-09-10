# MedEclipse Backoffice - Architecture Documentation

## Vue d'ensemble

Cette application MedEclipse Backoffice est conçue pour être une plateforme haute performance utilisant Next.js avec PPR (Partial Pre-rendering), Server-Side Rendering, et des stratégies de mise en cache avancées.

## Structure de la Documentation

### 📋 Documents Principaux
- [`01-project-overview.md`](./01-project-overview.md) - Vue d'ensemble du projet
- [`02-clean-architecture.md`](./02-clean-architecture.md) - Architecture propre Next.js
- [`03-performance-strategy.md`](./03-performance-strategy.md) - Stratégies de performance (PPR, SSR, caching)
- [`04-hr-service-design.md`](./04-hr-service-design.md) - Design du service RH
- [`05-api-specifications.md`](./05-api-specifications.md) - Spécifications des APIs
- [`06-database-design.md`](./06-database-design.md) - Conception de la base de données
- [`07-future-services.md`](./07-future-services.md) - Services futurs et extensibilité
- [`08-component-library.md`](./08-component-library.md) - Bibliothèque de composants (shadcn/ui)
- [`09-deployment-strategy.md`](./09-deployment-strategy.md) - Stratégie de déploiement
- [`10-development-workflow.md`](./10-development-workflow.md) - Workflow de développement

### 🏗️ Diagrammes d'Architecture
- [`diagrams/`](./diagrams/) - Diagrammes techniques
- [`schemas/`](./schemas/) - Schémas de données
- [`workflows/`](./workflows/) - Workflows métier

## Première Phase: Service RH

Le développement commence par le service de Gestion des Ressources Humaines, incluant:

1. **Gestion des Employés**
   - CRUD des profils employés
   - Gestion des rôles et permissions
   - Historique des modifications

2. **Gestion des Contrats**
   - Types de contrats
   - Durées et renouvellements
   - Documents contractuels

3. **Gestion des Congés**
   - Demandes de congés
   - Validation workflow
   - Calendrier des absences

4. **Évaluations & Performance**
   - Cycles d'évaluation
   - Objectifs et KPIs
   - Feedback 360°

## Technologies Utilisées

- **Frontend**: Next.js 15.5.2 avec React 19.1.0
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Build**: Turbopack pour des performances optimales
- **Architecture**: Clean Architecture pattern
- **Performance**: PPR, SSR, Advanced Caching

## Commencer le Développement

1. Lire la documentation dans l'ordre numérique
2. Suivre les spécifications d'architecture
3. Implémenter le service RH en premier
4. Respecter les patterns établis pour l'extensibilité

---

*Cette documentation évolue avec le projet. Assurez-vous de la maintenir à jour.*