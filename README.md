# pi-forge

A [Pi](https://github.com/earendil-works/pi-coding-agent) extension for a
workflow-oriented personal development environment.

Forge provides one default Tech Lead stance. Task-focused skills provide
specialized workflows and reference material on demand. Forge commands and tools
provide the user-facing workflow surface.

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

## Default stance

Forge always injects its Tech Lead prompt: pragmatic implementation and
coordination, with task-focused skills loaded when structured workflow or deeper
reference material helps.

There is no role switcher. Design and planning work happen through workflows such
as `/spec`, `/debug`, `/security`, and `/skill:work-planning`.

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

### `/forge`

Show Forge status, the default prompt preview, registered Forge commands, and
registered Forge tools.

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

Collect safe repository and dependency context and start the `security-audit` workflow.

```
/security                         — audit discovered security-relevant surfaces
/security auth and session flows  — audit with an explicit focus
```

Forge lists dependency manifests, package manager hints, dependency names,
security-relevant file candidates, and secret-like files by path only. It does
not read secret-bearing file contents and does not modify files.

### `/test [request]`

Collect test scripts, likely frameworks, and test files, then start the
`testing-workflow` skill.

### `/debug [symptom]`

Collect recent git context and start the reproduction-first `debugging-methodology` skill.

### `/spec [idea]`

Collect repository context and start the staged `spec-writing` workflow.

### `/commit [instructions]`

Collect git context and create Conventional Commit commits using `git-conventions`.
Forge stages and commits one logical change, asks before splitting mixed changes,
does nothing when there are no changes, and does not rewrite history unless
explicitly asked.

---

## Tools

Forge also registers reusable context tools for the model:

| Tool | What it does |
|---|---|
| `forge_git_context` | Collects git status, recent commits, diff stats, and diffs without mutating the repo |
| `forge_repo_map` | Collects a safe file map with manifests, security-relevant candidates, and secret-like paths by name only |
| `forge_dependency_inventory` | Collects dependency manifests, package manager hints, scripts, and dependency names without installing packages |
| `forge_test_summary` | Collects test scripts, likely frameworks, and test file paths without running tests |

---

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
