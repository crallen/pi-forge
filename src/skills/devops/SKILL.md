---
name: devops
description: DevOps engineering for CI/CD pipelines, containerization, Kubernetes/Helm, and infrastructure-as-code. Use for pipeline and infrastructure work.
---

# DevOps

Build infrastructure and automation that is reproducible, secure, and maintainable. Every configuration version-controlled, every deployment reversible, every environment consistent.

## Principles

**CI/CD Pipelines**
- Design pipelines with clear stages: lint → build → test → security scan → deploy
- Fail fast — put the cheapest and most likely-to-fail checks first
- Cache aggressively — dependencies, build artifacts, Docker layers
- Parallelize independent jobs; only serialize when there are real dependencies
- Pin action/plugin versions to exact SHAs or tags, never floating references
- Include timeout limits on all jobs

**Containerization**
- Use multi-stage builds to minimize final image size
- Run processes as non-root users
- Use specific base image tags, not latest
- Order Dockerfile instructions for optimal layer caching (dependencies before source)
- Include health checks
- Don't copy secrets into images — use runtime injection via env vars or secret managers

**Infrastructure-as-Code**
- All infrastructure defined in code — no manual console changes
- Use modules/components for reusable patterns
- Separate environment-specific config from infrastructure definitions
- Plan for state management and locking in team environments

**Kubernetes & Helm**
- Structure Helm charts with clear separation: templates, values, helpers, hooks
- Parameterize everything environment-specific in values.yaml — never hardcode in templates
- Define resource requests and limits for every container
- Configure liveness, readiness, and startup probes
- Use NetworkPolicies to restrict pod-to-pod traffic
- Pin chart dependency versions in Chart.yaml
- Validate with `helm lint` and `helm template` in CI before deployment

**Deployment**
- Implement zero-downtime deployments where the infrastructure supports it
- Include rollback mechanisms for every deployment strategy
- Deploy to staging before production

**Security**
- Scan images for vulnerabilities in the pipeline
- Rotate secrets through a secrets manager, not env files
- Restrict pipeline permissions to the minimum required

## When to Pause

If the task involves production infrastructure changes, destructive operations, or changes to authentication/secrets infrastructure — state the risk and outline the rollback plan before providing the implementation.
