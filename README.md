# pi-forge

A [Pi](https://github.com/earendil-works/pi-coding-agent) extension for a
workflow-oriented personal development environment.

Two primary roles provide session-long framing. Task-focused skills provide
specialized workflows and reference material on demand. Forge commands provide
the user-facing workflow surface as they are added.

---

## Requirements

- [Pi](https://github.com/earendil-works/pi-coding-agent) coding agent

---

## Install

```bash
pi install git:github.com/crallen/pi-forge
```

That's it. Pi clones the repo, loads the extension, and registers the skills automatically.

To try it without installing:

```bash
pi -e git:github.com/crallen/pi-forge
```

---

## Roles

Roles provide session-long personas, injected into the system prompt for every turn.

| Name | What it does |
|---|---|
| `tech-lead` | General-purpose implementation and coordination; uses task-focused skills for deep domain work |
| `architect` | High-level design, architectural decisions, and structural planning — no implementation |
| `none` | No role — Pi's default behavior |

`tech-lead` is the default. Switch with `/role [name]`. The active role is shown
in the Pi footer as `⚒ forge · Role Name`.

Role selection persists across `/reload` and session restarts. Start Pi with a
role pre-selected using the `--role` flag:

```bash
pi --role architect
```

---

## Skills

Skills are loaded on demand for specialized domain tasks. They are available
to the model automatically and can also be invoked directly.

| Skill | What it does |
|---|---|
| `coding-guardrails` | Cross-cutting execution discipline for non-trivial implementation work |
| `spec-writing` | Collaborative workflow for turning ideas into design specs |
| `backend-patterns` | App-layer patterns: handlers, services, validation, auth |
| `frontend-patterns` | UI components, styling, accessibility, responsive design |
| `database-patterns` | Schema design, migrations, query optimization, transactions |
| `infrastructure-workflows` | CI/CD, Docker, Helm, Terraform/OpenTofu/Terragrunt, cloud CLI usage |
| `documentation` | Style guide and templates for READMEs, API docs, ADRs, changelogs |
| `debugging-methodology` | Phased workflow for reproducing, diagnosing, and verifying bug fixes |
| `git-conventions` | Conventional Commits format, branching model, commit hygiene |
| `code-review` | Structured code quality review with classified findings |
| `security-audit` | Evidence-backed security assessment with vulnerability taxonomy and remediation guidance |
| `testing-workflow` | Test strategy and execution: suites, coverage, mocking, failures |
| `work-planning` | Breaks overwhelming work into sequential, time-boxed tasks |

Invoke directly: `/skill:code-review`, `/skill:security-audit`, etc.

Old persona-style skill names such as `auditor`, `reviewer`, and `planner` were intentionally removed in favor of task-focused names.

---

## Commands

### `/role [name]`

Switch the active role, or show available roles with no argument.

```
/role             — list roles, show active one
/role architect   — switch to Architect
/role none        — clear role, use Pi's default behavior
```

Tab completion works for role names.

### `/forge`

Show the active role and a preview of its system prompt — useful for verifying
what's actually being injected.

### `/review [scope] [focus]`

Collect git context and start the `code-review` workflow.

```
/review                         — review staged and unstaged changes
/review staged                  — review staged changes only
/review unstaged                — review unstaged changes only
/review branch main             — review changes since main
/review focus on error handling — review current changes with extra focus
```

Forge collects branch, status, recent commits, diff stats, and relevant diffs,
then sends a `/skill:code-review` handoff prompt. It does not modify files.

### `/security [focus]`

Collect safe repository context and start the `security-audit` workflow.

```
/security                         — audit discovered security-relevant surfaces
/security auth and session flows  — audit with an explicit focus
```

Forge lists dependency manifests, security-relevant file candidates, and
secret-like files by path only. It does not read secret-bearing file contents
and does not modify files.

### `/test [request]`

Collect repository test context and start the `testing-workflow` skill.

### `/debug [symptom]`

Collect recent git context and start the reproduction-first `debugging-methodology` skill.

### `/spec [idea]`

Collect repository context and start the staged `spec-writing` workflow.

### `/commit [instructions]`

Collect git context and draft Conventional Commit messages using `git-conventions`.
Forge does not run `git add` or `git commit`.

---

## Adding a role

Add an entry to `src/roles.ts` and a corresponding `src/prompts/<name>.md`:

```typescript
// src/roles.ts
"my-role": {
  label: "My Role",
  description: "One-line description shown in /role list",
  primary: true, // optional — shows under "Primary:" in /role output
},
```

```markdown
<!-- src/prompts/my-role.md -->
You are a ...
```

Then `/reload` in Pi to pick up the change.

## Adding a skill

Create a new directory under `src/skills/` with a `SKILL.md`:

```
src/skills/my-skill/SKILL.md
```

```markdown
---
name: my-skill
description: What this skill does and when to use it. Be specific.
---

# My Skill

Instructions for the model when this skill is active...
```

Then `/reload` in Pi to pick up the change.

---

## License

MIT
