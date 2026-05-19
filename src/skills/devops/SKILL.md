---
name: devops
description: DevOps engineering for CI/CD pipelines, Docker, Helm/Kubernetes, Terraform/OpenTofu/Terragrunt, and cloud CLI usage. Use for pipeline and infrastructure work.
---

# DevOps

Build infrastructure and automation that is reproducible, secure, and maintainable. Every configuration version-controlled, every deployment reversible, every environment consistent.

## CI/CD Pipelines

**General principles:**
- Design pipelines with clear stages: lint → build → test → security scan → deploy
- Fail fast — put the cheapest and most likely-to-fail checks first
- Cache aggressively — dependencies, build artifacts, Docker layers
- Parallelize independent jobs; only serialize when there are real dependencies
- Include timeout limits on all jobs
- Pin action/plugin/orb versions — never use floating references

**GitHub Actions:**
- Use `concurrency` groups to cancel stale in-progress runs on new pushes
- Use `actions/cache` or built-in setup-action caching (e.g., `setup-node` with `cache: npm`)
- Use reusable workflows (`workflow_call`) to share pipeline logic across repos
- Store secrets in GitHub Secrets; expose as env vars, never echo them
- Use `permissions:` to restrict each job to the minimum required (default: read-only)
- Use `environment:` with protection rules to gate production deployments
- Pin third-party actions to full commit SHAs, not tags
- Use matrix builds for multi-version or multi-platform testing
- Use `actions/upload-artifact` / `download-artifact` to pass build outputs between jobs

**CircleCI:**
- Use orbs for reusable pipeline logic; pin orb versions explicitly
- Use executors to define reusable runtime environments
- Use caching with deterministic cache keys (e.g., based on lock file checksums)
- Use workflows with `requires:` to express job dependencies
- Use contexts for shared secrets across projects
- Use dynamic config to conditionally run pipeline branches
- Resource class selection matters: match CPU/memory to actual job needs

**Shared practices:**
- Keep pipeline configuration in version control alongside application code
- Validate pipeline syntax in CI before merging (GitHub: `actionlint`; CircleCI: `circleci config validate`)
- Fail the pipeline on security scan findings above a threshold
- Use OIDC for cloud authentication instead of long-lived credentials where supported

## Docker

- Use multi-stage builds to minimize final image size — build deps stay in build stage only
- Pin base image tags to specific versions, never `latest`
- Order Dockerfile instructions for optimal layer caching: system deps → app deps → source code
- Run processes as non-root users; create a dedicated user if the base image doesn't provide one
- Include `HEALTHCHECK` instructions for services
- Never copy secrets into images; inject at runtime via env vars or secret mounts
- Use `.dockerignore` to exclude build artifacts, tests, and local config from build context
- Use `--mount=type=secret` for secrets needed only at build time (e.g., private package registry tokens)
- Prefer `COPY` over `ADD` unless you specifically need `ADD`'s tar extraction or URL fetching

## Helm

- Structure charts with clear separation: `templates/`, `values.yaml`, `_helpers.tpl`, hooks
- Parameterize all environment-specific values — never hardcode in templates
- Use `_helpers.tpl` for reusable template fragments and naming conventions
- Define resource requests and limits for every container; unset limits cause noisy neighbor problems
- Configure liveness, readiness, and startup probes appropriate to the application's startup time
- Use `NetworkPolicy` resources to restrict pod-to-pod traffic to the minimum required
- Pin chart dependency versions in `Chart.yaml`; run `helm dependency update` in CI
- Validate with `helm lint` and `helm template | kubectl apply --dry-run=server` in CI before deployment
- Use Helm hooks for pre-install/pre-upgrade jobs (e.g., database migrations)
- Keep `values.yaml` as the canonical reference; use environment overlays (`values-staging.yaml`) for overrides
- Never store secrets in `values.yaml`; use external secrets operators or vault injection

## Terraform / OpenTofu / Terragrunt

**Constraints — read-only operations only:**

Do not run state-altering commands. The following are off-limits:

| Command | Reason |
|---|---|
| `apply` / `run-all apply` | Modifies real infrastructure |
| `destroy` / `run-all destroy` | Destroys real infrastructure |
| `import` | Alters state file |
| `state mv` | Alters state file |
| `state rm` | Alters state file |
| `state push` | Overwrites remote state |
| `workspace new` / `workspace delete` | Alters workspace state |

Permitted read-only operations: `init`, `plan`, `validate`, `fmt`, `show`, `output`, `state list`, `state show`, `providers`, `version`.

Present the plan output and configuration for the user to review and apply themselves.

**Workflow:**
- Always produce a `plan` for review before any infrastructure change
- Use remote state (S3 + DynamoDB, GCS, Terraform Cloud) — never commit `.tfstate` files
- Enable state locking; treat lock conflicts as a signal to investigate before overriding
- Use `terraform fmt` and `terraform validate` in CI as a lint step
- Run `terraform plan` in CI on PRs and post the output as a comment for review
- Use `PLANFILE` outputs to ensure `apply` uses exactly the plan that was reviewed
- Tag all cloud resources consistently using locals and `default_tags` (AWS provider) or equivalent

**Module design:**
- Modules should encapsulate a single logical resource group with a clear interface (inputs/outputs)
- Pin module versions explicitly when referencing remote modules
- Keep modules small and composable; avoid mega-modules that own too much
- Document all variables and outputs with `description` fields
- Use `validation` blocks on variables to catch bad inputs early

**State management:**
- Use separate state files per environment (dev, staging, prod) — never share state
- Use `state list` and `state show` to inspect state — do not run `import`, `state mv`, or `state rm`
- Document any state manipulation that the user will need to run manually in the implementation notes

**Terragrunt:**
- Use `terragrunt.hcl` at the root to define remote state and provider configuration once
- Use `dependency` blocks to reference outputs from other Terragrunt units
- Use `inputs = {}` in unit-level `terragrunt.hcl` to pass environment-specific values
- Use `run-all plan` to preview changes across multiple units; present for user review
- Keep the folder structure mirroring the environment/account/region hierarchy

**Security:**
- Never hardcode credentials in `.tf` files; use provider environment variables or IAM roles
- Use `sensitive = true` on output values that contain secrets
- Enable provider version constraints in `required_providers`

## Cloud CLIs

**Constraints — confirm before write operations:**

Before running any CLI command that creates, modifies, or deletes a resource, state what the command will do and ask for explicit confirmation. Read-only commands (`list`, `describe`, `get`, `show`, `status`) may run freely.

Write operations requiring confirmation include (but are not limited to):
- **AWS CLI:** `create-*`, `put-*`, `update-*`, `delete-*`, `modify-*`, `attach-*`, `detach-*`, `terminate-*`, `stop-*`, `start-*`, `run-instances`
- **gcloud:** `create`, `update`, `delete`, `deploy`, `set`, `add-iam-policy-binding`, `remove-iam-policy-binding`
- **Azure CLI:** `create`, `update`, `delete`, `set`, `assign`, `remove`, `deploy`

**General practices:**
- Always target a specific account/project/subscription explicitly — avoid relying on defaults in scripts
- Use `--output json` (AWS, gcloud) for machine-readable output; pipe through `jq` for parsing
- Use `--dry-run` or equivalent flags when available to preview changes before confirming
- Set explicit regions/zones in scripts; don't rely on config file defaults
- Use service accounts and workload identity for CI/CD, not personal credentials

**AWS CLI:**
- Use named profiles (`~/.aws/credentials`, `--profile`) to manage multiple accounts
- Use `aws sts assume-role` for cross-account access; use `--duration-seconds` to limit session length
- Use `AWS_PROFILE` and `AWS_DEFAULT_REGION` env vars for scripting
- Use `aws configure list` to verify active credentials and region before running destructive commands
- Use `--query` for server-side filtering; it's faster than piping all results through `jq`
- Prefer OIDC / IAM Identity Center over long-lived access keys for CI

**gcloud (Google Cloud):**
- Use `gcloud config configurations` to manage multiple projects/accounts
- Use `CLOUDSDK_CORE_PROJECT` and `CLOUDSDK_COMPUTE_REGION` env vars in scripts
- Use `gcloud auth application-default login` for local dev; use service account keys or Workload Identity for CI
- Use `--format=json` for scripting; use `--format="value(field)"` for simple value extraction
- Use `gcloud projects list --filter` to scope operations to specific projects

**Azure CLI:**
- Use `az account set --subscription` to target a specific subscription before running commands
- Use `az login --service-principal` with federated credentials or certificates in CI
- Use `--output json` for scripting; use `--query` (JMESPath) for filtering
- Use `az group list --tag` for scoped operations

## Security

- Scan container images for vulnerabilities in the pipeline (Trivy, Grype, Snyk)
- Rotate secrets through a secrets manager (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager)
- Restrict pipeline permissions to the minimum required for each job
- Use OIDC federation for cloud access from CI instead of long-lived credentials

## When to Pause

If the task involves production infrastructure changes or changes to authentication/secrets infrastructure — state the risk and outline the rollback plan before providing configuration or commands.
