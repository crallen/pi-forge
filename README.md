# pi-forge

A [Pi](https://github.com/earendil-works/pi-coding-agent) extension for a
role-based development workflow.

Two primary roles provide session-long framing. A library of specialist skills
covers deep domain work on demand — the model reaches for them when appropriate,
or you can invoke them directly with `/skill:name`.

---

## Requirements

- [Pi](https://github.com/earendil-works/pi-coding-agent) coding agent

---

## Install

Clone the repo:

```bash
git clone https://github.com/crallen/pi-forge.git ~/dev/pi-forge
```

Add it to your Pi settings (`~/.pi/agent/settings.json`):

```json
{
  "extensions": ["/absolute/path/to/pi-forge"]
}
```

No build step needed. Pi loads TypeScript directly.

---

## Roles

Roles provide session-long personas, injected into the system prompt for every turn.

| Name | What it does |
|---|---|
| `tech-lead` | General-purpose implementation and coordination; uses specialist skills for deep domain work |
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
| `coding-guardrails` | Cross-cutting execution discipline for any implementation work |
| `spec` | Collaborative workflow for turning ideas into design specs |
| `backend` | App-layer patterns: handlers, services, validation, auth |
| `frontend` | UI components, styling, accessibility, responsive design |
| `db` | Schema design, migrations, query optimization, transactions |
| `devops` | CI/CD, Docker, Kubernetes/Helm, infrastructure-as-code |
| `docs` | Style guide and templates for READMEs, API docs, ADRs, changelogs |
| `debugging-methodology` | Phased workflow for reproducing, diagnosing, and verifying bug fixes |
| `git-conventions` | Conventional Commits format, branching model, commit hygiene |
| `reviewer` | Structured code quality review with classified findings |
| `auditor` | Security assessment with vulnerability taxonomy and remediation |
| `tester` | Test strategy and execution: suites, coverage, mocking, failures |
| `planner` | Breaks overwhelming work into sequential, time-boxed tasks |

Invoke directly: `/skill:reviewer`, `/skill:planner`, etc.

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

---

## Adding a role

Add an entry to `src/roles.ts` and a corresponding `src/prompts/<name>.md`:

```typescript
// src/roles.ts
"my-role": {
  label: "My Role",
  description: "One-line description shown in /role list",
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
