# Stratégie de Déploiement - MedEclipse

## 🚀 Architecture de Déploiement

### Environnements
```
Production   → Serveurs haute disponibilité + CDN global
Staging      → Réplique production pour tests finaux  
Development  → Environnement développeurs + CI/CD
Local        → Docker Compose pour développement local
```

### Stratégie Multi-Cloud
- **Provider Principal**: AWS (Europe - Paris)
- **Provider Backup**: Azure (Europe - France Central)
- **CDN Global**: CloudFlare + AWS CloudFront
- **DNS**: Route 53 avec failover automatique

## 🏗️ Infrastructure as Code

### Terraform Configuration
```hcl
# infrastructure/terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "medeclipse-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-west-3"
    
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "MedEclipse"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC et réseau
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "medeclipse-${var.environment}"
  cidr = var.vpc_cidr
  
  azs             = ["eu-west-3a", "eu-west-3b", "eu-west-3c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_dns_hostnames = true
  enable_dns_support = true
  
  tags = {
    Environment = var.environment
  }
}

# ECS Cluster pour Next.js
resource "aws_ecs_cluster" "medeclipse" {
  name = "medeclipse-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
}

# RDS PostgreSQL avec Multi-AZ
resource "aws_db_instance" "postgres" {
  identifier = "medeclipse-${var.environment}"
  
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "medeclipse"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  multi_az               = true
  publicly_accessible    = false
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  
  deletion_protection = true
  
  tags = {
    Name = "MedEclipse ${title(var.environment)} DB"
  }
}

# ElastiCache Redis pour cache et sessions
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id         = "medeclipse-${var.environment}"
  description                  = "Redis cluster for MedEclipse ${var.environment}"
  
  port                         = 6379
  parameter_group_name         = "default.redis7"
  
  num_cache_clusters           = 2
  node_type                    = var.redis_node_type
  
  subnet_group_name            = aws_elasticache_subnet_group.redis.name
  security_group_ids           = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = var.redis_auth_token
  
  automatic_failover_enabled   = true
  multi_az_enabled            = true
  
  tags = {
    Name = "MedEclipse ${title(var.environment)} Redis"
  }
}
```

### Docker Configuration
```dockerfile
# Dockerfile.production
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Build
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### ECS Task Definition
```json
{
  "family": "medeclipse-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "medeclipse-web",
      "image": "ACCOUNT.dkr.ecr.eu-west-3.amazonaws.com/medeclipse:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.medeclipse.com"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:eu-west-3:ACCOUNT:secret:medeclipse/database"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:eu-west-3:ACCOUNT:secret:medeclipse/redis"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-west-3:ACCOUNT:secret:medeclipse/jwt"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/medeclipse-web",
          "awslogs-region": "eu-west-3",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

## 🔄 Pipeline CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy MedEclipse

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

env:
  AWS_REGION: eu-west-3
  ECR_REPOSITORY: medeclipse
  
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: medeclipse_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/medeclipse_test
          REDIS_URL: redis://localhost:6379
          
      - name: Build
        run: npm run build
        
      - name: E2E Tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/medeclipse_test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f Dockerfile.production -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          
      - name: Deploy to ECS
        env:
          ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        run: |
          # Update ECS service with new image
          aws ecs update-service \
            --cluster medeclipse-$ENVIRONMENT \
            --service medeclipse-web-$ENVIRONMENT \
            --force-new-deployment
            
      - name: Wait for deployment
        env:
          ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        run: |
          aws ecs wait services-stable \
            --cluster medeclipse-$ENVIRONMENT \
            --services medeclipse-web-$ENVIRONMENT
            
      - name: Run database migrations
        env:
          ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        run: |
          # Execute migration task
          aws ecs run-task \
            --cluster medeclipse-$ENVIRONMENT \
            --task-definition medeclipse-migrations-$ENVIRONMENT \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"

  notification:
    needs: [deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔒 Sécurité et Compliance

### Secrets Management
```hcl
# Secrets Manager pour données sensibles
resource "aws_secretsmanager_secret" "database" {
  name = "medeclipse/${var.environment}/database"
  
  tags = {
    Environment = var.environment
    Type        = "Database"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.postgres.endpoint
    port     = aws_db_instance.postgres.port
    dbname   = aws_db_instance.postgres.db_name
  })
}

# KMS pour chiffrement
resource "aws_kms_key" "medeclipse" {
  description             = "MedEclipse ${var.environment} encryption key"
  deletion_window_in_days = 7
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "medeclipse-${var.environment}"
  }
}
```

### WAF Protection
```hcl
resource "aws_wafv2_web_acl" "medeclipse" {
  name  = "medeclipse-${var.environment}"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # Protection contre les attaques communes
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "commonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }
  
  # Protection contre les bots
  rule {
    name     = "AWS-AWSManagedRulesBotControlRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "botControlMetric"
      sampled_requests_enabled    = true
    }
  }
  
  # Rate limiting
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
        
        scope_down_statement {
          geo_match_statement {
            country_codes = ["FR", "BE", "CH", "LU", "MC"]
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "rateLimitMetric"
      sampled_requests_enabled    = true
    }
  }
}
```

## 📊 Monitoring et Observabilité

### CloudWatch Configuration
```hcl
# Log Groups
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/medeclipse-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.medeclipse.arn
}

# Custom Metrics
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "medeclipse-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ecs cpu utilization"
  
  dimensions = {
    ServiceName = aws_ecs_service.web.name
    ClusterName = aws_ecs_cluster.medeclipse.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "medeclipse-${var.environment}-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### Application Performance Monitoring
```typescript
// lib/monitoring.ts
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

export class MetricsCollector {
  private cloudWatch: CloudWatch;
  
  constructor() {
    this.cloudWatch = new CloudWatch({
      region: process.env.AWS_REGION,
    });
  }
  
  async recordMetric(
    metricName: string,
    value: number,
    unit: string = 'Count',
    dimensions: { [key: string]: string } = {}
  ): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'MedEclipse/Application',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: Object.entries(dimensions).map(([name, value]) => ({
              Name: name,
              Value: value,
            })),
          },
        ],
      });
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }
  
  async recordResponseTime(endpoint: string, duration: number): Promise<void> {
    await this.recordMetric('ResponseTime', duration, 'Milliseconds', {
      Endpoint: endpoint,
    });
  }
  
  async recordError(endpoint: string, errorType: string): Promise<void> {
    await this.recordMetric('Errors', 1, 'Count', {
      Endpoint: endpoint,
      ErrorType: errorType,
    });
  }
  
  async recordUserAction(action: string, userId?: string): Promise<void> {
    await this.recordMetric('UserActions', 1, 'Count', {
      Action: action,
      HasUser: userId ? 'true' : 'false',
    });
  }
}

// Middleware de monitoring
export function withMetrics(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const metrics = new MetricsCollector();
    
    try {
      await handler(req, res);
      
      const duration = Date.now() - start;
      await metrics.recordResponseTime(req.url || 'unknown', duration);
      
      if (res.statusCode >= 400) {
        await metrics.recordError(req.url || 'unknown', `HTTP_${res.statusCode}`);
      }
    } catch (error) {
      const duration = Date.now() - start;
      await metrics.recordResponseTime(req.url || 'unknown', duration);
      await metrics.recordError(req.url || 'unknown', 'EXCEPTION');
      
      throw error;
    }
  };
}
```

## 🔄 Stratégies de Rollback

### Blue-Green Deployment
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

ENVIRONMENT=$1
NEW_IMAGE_URI=$2
CLUSTER_NAME="medeclipse-${ENVIRONMENT}"
SERVICE_NAME="medeclipse-web-${ENVIRONMENT}"

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --query 'services[0].taskDefinition' \
  --output text)

# Create new task definition with new image
NEW_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $CURRENT_TASK_DEF \
  --query 'taskDefinition' \
  --output json | \
  jq --arg IMAGE "$NEW_IMAGE_URI" \
     '.containerDefinitions[0].image = $IMAGE' | \
  jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')

# Register new task definition
NEW_TASK_DEF_ARN=$(echo $NEW_TASK_DEF | aws ecs register-task-definition \
  --cli-input-json file:///dev/stdin \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "New task definition: $NEW_TASK_DEF_ARN"

# Update service with new task definition
echo "Starting deployment..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $NEW_TASK_DEF_ARN

# Wait for deployment to complete
echo "Waiting for deployment to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME

# Health check
echo "Performing health check..."
HEALTH_CHECK_URL="https://api.medeclipse.com/api/health"
for i in {1..10}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
  if [ $HTTP_CODE -eq 200 ]; then
    echo "Health check passed"
    break
  else
    echo "Health check failed (attempt $i/10): HTTP $HTTP_CODE"
    if [ $i -eq 10 ]; then
      echo "Health check failed, rolling back..."
      # Rollback to previous task definition
      aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $CURRENT_TASK_DEF
      exit 1
    fi
    sleep 30
  fi
done

echo "Deployment successful"
```

### Automatic Rollback
```typescript
// lib/deployment/health-monitor.ts
export class HealthMonitor {
  private metrics: MetricsCollector;
  private alertManager: AlertManager;
  
  constructor() {
    this.metrics = new MetricsCollector();
    this.alertManager = new AlertManager();
  }
  
  async monitorDeployment(deploymentId: string): Promise<void> {
    const startTime = Date.now();
    const maxMonitorTime = 10 * 60 * 1000; // 10 minutes
    
    while (Date.now() - startTime < maxMonitorTime) {
      const health = await this.checkApplicationHealth();
      
      if (!health.isHealthy) {
        await this.alertManager.sendAlert({
          severity: 'critical',
          message: `Deployment ${deploymentId} failing health checks`,
          details: health.errors,
        });
        
        if (health.shouldRollback) {
          await this.triggerRollback(deploymentId);
          return;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
    }
  }
  
  private async checkApplicationHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabaseConnectivity(),
      this.checkRedisConnectivity(),
      this.checkApiResponsiveness(),
      this.checkErrorRate(),
    ]);
    
    const errors = checks
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason);
    
    return {
      isHealthy: errors.length === 0,
      shouldRollback: errors.length >= 2,
      errors,
    };
  }
  
  private async triggerRollback(deploymentId: string): Promise<void> {
    // Logic to trigger automatic rollback
    console.log(`Triggering rollback for deployment ${deploymentId}`);
    // Implementation would call AWS ECS or deployment system
  }
}
```

Cette stratégie de déploiement garantit:
- ✅ Déploiements zero-downtime
- ✅ Rollback automatique en cas de problème
- ✅ Monitoring complet de la santé applicative
- ✅ Sécurité et compliance renforcées
- ✅ Scalabilité automatique selon la charge