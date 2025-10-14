# ops/ Agent Instructions

## 📍 Context

> **Purpose**: DevOps, deployment automation, infrastructure-as-code, and operational tooling.
> **When to use**: When working with deployment, CI/CD, infrastructure, monitoring, or operational concerns.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**
- Infrastructure as Code (IaC)
- Deployment automation and scripts
- CI/CD pipeline configuration
- Container orchestration (Docker, Kubernetes)
- Monitoring and observability setup
- Backup and disaster recovery
- Environment configuration management

**Philosophy**: Infrastructure as code, automated deployments, observable systems

## 📁 Key Files & Patterns

### Directory Structure

```
ops/
├── docker/                     # Docker configurations
│   ├── Dockerfile.web          # Web app container
│   ├── Dockerfile.api          # API container
│   ├── Dockerfile.dev          # Development container
│   ├── docker-compose.yml      # Local development
│   └── docker-compose.prod.yml # Production simulation
├── kubernetes/                 # Kubernetes manifests
│   ├── deployments/
│   │   ├── web.yaml
│   │   └── api.yaml
│   ├── services/
│   │   ├── web-service.yaml
│   │   └── api-service.yaml
│   ├── ingress/
│   │   └── ingress.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   └── secrets/
│       └── .gitkeep
├── terraform/                  # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── database/
│   │   ├── networking/
│   │   └── compute/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
├── ansible/                    # Configuration management
│   ├── playbooks/
│   ├── roles/
│   └── inventory/
├── monitoring/                 # Monitoring configuration
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── alerting/
│       └── alerts.yml
├── scripts/                    # Operational scripts
│   ├── backup.sh
│   ├── restore.sh
│   ├── deploy.sh
│   └── health-check.sh
└── README.md                   # Ops documentation
```

## 🧭 Routing Rules

### Use This Context When:

- [ ] Setting up deployment pipelines
- [ ] Configuring infrastructure
- [ ] Writing Docker/Kubernetes configs
- [ ] Creating monitoring dashboards
- [ ] Automating operational tasks
- [ ] Managing secrets and environment variables

### Refer to Other Contexts When:

| Context | When to Use |
|---------|-------------|
| [.github/AGENT.md](/.github/AGENT.md) | GitHub Actions workflows and CI/CD |
| [scripts/AGENT.md](/scripts/AGENT.md) | Build and development scripts |
| [docs/AGENT.md](/docs/AGENT.md) | Operational documentation and runbooks |
| [architecture/AGENT.md](/architecture/AGENT.md) | Deployment architecture diagrams |

## 🔧 Local Conventions

### Docker Best Practices

**Multi-stage builds for production:**

```dockerfile
# ops/docker/Dockerfile.web
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Development docker-compose:**

```yaml
# ops/docker/docker-compose.yml
version: '3.9'

services:
  web:
    build:
      context: ../..
      dockerfile: ops/docker/Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/vibespro_dev
    volumes:
      - ../../:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  api:
    build:
      context: ../..
      dockerfile: ops/docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/vibespro_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ../../:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=vibespro_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Patterns

**Deployment with health checks:**

```yaml
# ops/kubernetes/deployments/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibespro-api
  namespace: production
  labels:
    app: vibespro
    component: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: vibespro
      component: api
  template:
    metadata:
      labels:
        app: vibespro
        component: api
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: api
          image: ghcr.io/godspeedai/vibespro-api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3001
              protocol: TCP
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3001"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: vibespro-secrets
                  key: database-url
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

**Service configuration:**

```yaml
# ops/kubernetes/services/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: vibespro-api
  namespace: production
  labels:
    app: vibespro
    component: api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3001
      protocol: TCP
      name: http
  selector:
    app: vibespro
    component: api
```

### Terraform Infrastructure

**Main configuration:**

```hcl
# ops/terraform/main.tf
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "vibespro-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "VibesPro"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/networking"

  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# RDS Database
module "database" {
  source = "./modules/database"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  database_name       = var.database_name
  master_username     = var.database_username
  master_password     = var.database_password
}

# ECS Cluster
module "ecs_cluster" {
  source = "./modules/compute"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
}
```

**Variables:**

```hcl
# ops/terraform/variables.tf
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "vibespro"
}

variable "database_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
```

### Monitoring with Prometheus

```yaml
# ops/monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  # Application metrics
  - job_name: 'vibespro-api'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - production
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: vibespro
      - source_labels: [__meta_kubernetes_pod_label_component]
        action: keep
        regex: api

  # Node metrics
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):10250'
        replacement: '${1}:9100'
        target_label: __address__

  # PostgreSQL metrics
  - job_name: 'postgres'
    static_configs:
      - targets:
          - postgres-exporter:9187
```

**Alert rules:**

```yaml
# ops/monitoring/alerting/alerts.yml
groups:
  - name: application
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m])
          / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.job }}"

      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: PodDown
        expr: |
          kube_pod_status_phase{phase!~"Running|Succeeded"} > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod not running"
          description: "Pod {{ $labels.pod }} is in {{ $labels.phase }} state"
```

## 📚 Related Instructions

**Modular instructions that apply here:**
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - **Security in infrastructure (CRITICAL)**
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Infrastructure testing
- [.github/instructions/performance.instructions.md](/.github/instructions/performance.instructions.md) - Performance monitoring

**Relevant documentation:**
- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes patterns](https://kubernetes.io/docs/concepts/)
- [Terraform documentation](https://www.terraform.io/docs)

## 💡 Examples

See inline examples above for:
- Multi-stage Dockerfile
- docker-compose.yml for local development
- Kubernetes deployment with health checks
- Terraform infrastructure configuration
- Prometheus monitoring setup
- Alert rules for production

### Example: Deployment Script

```bash
#!/bin/bash
# ops/scripts/deploy.sh

set -euo pipefail

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 Deploying VibesPro to $ENVIRONMENT (version: $VERSION)"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "Usage: $0 <dev|staging|production> [version]"
  exit 1
fi

# Build Docker images
echo "📦 Building Docker images..."
docker build -t vibespro-web:$VERSION -f ops/docker/Dockerfile.web .
docker build -t vibespro-api:$VERSION -f ops/docker/Dockerfile.api .

# Push to registry
echo "📤 Pushing images to registry..."
docker tag vibespro-web:$VERSION ghcr.io/godspeedai/vibespro-web:$VERSION
docker tag vibespro-api:$VERSION ghcr.io/godspeedai/vibespro-api:$VERSION
docker push ghcr.io/godspeedai/vibespro-web:$VERSION
docker push ghcr.io/godspeedai/vibespro-api:$VERSION

# Update Kubernetes manifests
echo "🔧 Updating Kubernetes deployments..."
kubectl set image deployment/vibespro-web \
  web=ghcr.io/godspeedai/vibespro-web:$VERSION \
  --namespace=$ENVIRONMENT

kubectl set image deployment/vibespro-api \
  api=ghcr.io/godspeedai/vibespro-api:$VERSION \
  --namespace=$ENVIRONMENT

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/vibespro-web --namespace=$ENVIRONMENT
kubectl rollout status deployment/vibespro-api --namespace=$ENVIRONMENT

echo "✅ Deployment complete!"
```

## ✅ Checklist

### Before Deploying:

- [ ] Test in local environment (docker-compose)
- [ ] Run security scans on Docker images
- [ ] Update Kubernetes manifests with new versions
- [ ] Review resource limits and requests
- [ ] Verify environment variables and secrets
- [ ] Check health check endpoints

### During Deployment:

- [ ] Monitor logs in real-time
- [ ] Watch for pod restarts
- [ ] Verify health checks passing
- [ ] Check metrics dashboards
- [ ] Test critical user flows

### After Deployment:

- [ ] Verify all services healthy
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update deployment log

## 🔍 Quick Reference

### Common Commands

```bash
# Docker
docker build -t myapp .
docker-compose up -d
docker-compose logs -f
docker-compose down

# Kubernetes
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
kubectl logs -f <pod-name> -n production
kubectl exec -it <pod-name> -n production -- /bin/sh

# Apply configurations
kubectl apply -f ops/kubernetes/deployments/
kubectl rollout status deployment/vibespro-api
kubectl rollout undo deployment/vibespro-api

# Terraform
cd ops/terraform/environments/production
terraform init
terraform plan
terraform apply
terraform destroy
```

### Docker Commands

| Command | Purpose |
|---------|---------|
| `docker build -t name .` | Build image |
| `docker run -p 3000:3000 name` | Run container |
| `docker ps` | List running containers |
| `docker logs <container>` | View logs |
| `docker exec -it <container> sh` | Execute shell |
| `docker-compose up` | Start all services |

### Kubernetes Commands

| Command | Purpose |
|---------|---------|
| `kubectl get pods` | List pods |
| `kubectl describe pod <name>` | Pod details |
| `kubectl logs -f <pod>` | Stream logs |
| `kubectl exec -it <pod> -- sh` | Execute shell |
| `kubectl apply -f file.yaml` | Apply config |
| `kubectl delete -f file.yaml` | Delete resources |

## 🛡️ Security Considerations (CRITICAL)

**Infrastructure security is paramount:**

- ⚠️ **Secrets management**: Use Kubernetes secrets, AWS Secrets Manager, or HashiCorp Vault
- ⚠️ **Network policies**: Restrict pod-to-pod communication
- ⚠️ **Image scanning**: Scan Docker images for vulnerabilities (Trivy, Clair)
- ⚠️ **Least privilege**: Run containers as non-root users
- ⚠️ **Resource limits**: Set CPU/memory limits to prevent DoS
- ⚠️ **TLS everywhere**: Encrypt all network traffic
- ⚠️ **Access control**: Use RBAC for Kubernetes, IAM for cloud

**Example security configurations:**

```yaml
# Non-root user in Dockerfile
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# Security context in Kubernetes
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
        readOnlyRootFilesystem: true
```

## 🎯 Testing Strategy

### Infrastructure Testing

**Test Docker builds:**
```bash
# Build and test locally
docker build -t test-image .
docker run --rm test-image npm test

# Test with docker-compose
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

**Test Kubernetes manifests:**
```bash
# Dry-run to validate YAML
kubectl apply --dry-run=client -f ops/kubernetes/

# Use kubeval for validation
kubeval ops/kubernetes/**/*.yaml
```

**Test Terraform:**
```bash
# Validate configuration
terraform validate

# Plan without applying
terraform plan

# Use tflint
tflint
```

## 🔄 Maintenance

### Regular Tasks

- **Daily**: Monitor alerts, check logs
- **Weekly**: Review resource usage, optimize costs
- **Monthly**: Update base images, review security scans
- **Quarterly**: Disaster recovery drills, capacity planning

### When to Update This AGENT.md

- New deployment targets added
- Infrastructure patterns change
- Monitoring strategy evolves
- Security practices update

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
