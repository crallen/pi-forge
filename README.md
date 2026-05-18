# pi-forge

Personal development workflow extension for [Pi](https://github.com/earendil-works/pi-coding-agent).

Provides role-based AI personas for each stage of the dev workflow, plus safety
guards for protected project directories.

---

## Install

Clone or move this repo anywhere, then add the path to your Pi settings
(`~/.pi/agent/settings.json`):

```json
{
  "extensions": ["/absolute/path/to/pi-forge"]
}
```

Pi reads the `pi.extensions` field in `package.json` to find the entry point.
No compilation step needed — Pi loads TypeScript directly via jiti.

---

## Commands

### `/role [name]`

Switch the active role, or show available roles if no name is given.

```
/role             — list all roles and show the active one
/role tech-lead   — switch to Tech Lead
/role none        — clear role, use Pi's default behavior
```

Tab completion is available for role names.

### `/forge`

Show extension status: active role and protected directories.

---

## Roles

| Name | Description |
|---|---|
| `none` | No role — Pi's default behavior |
| `tech-lead` | Orchestrates complex workflows; coordinates specialist roles |
| `architect` | High-level design, patterns, ADRs — no implementation code |
| `spec` | Transforms vague requests into precise requirements and acceptance criteria |
| `implementer` | Precise backend coding with strict scope adherence |
| `frontend` | UI components, styling, accessibility, responsive design |
| `db` | Schema design, migrations, query optimization, indexing |
| `devops` | CI/CD, Docker, Kubernetes/Helm, infrastructure-as-code |
| `docs` | Technical documentation with relaxed, concise style |
| `reviewer` | Read-only code quality review with actionable findings |
| `auditor` | Read-only security review with severity classification |
| `tester` | Test coverage: writing, executing, diagnosing failures |
| `planner` | Breaks overwhelming complexity into time-boxed sequential tasks |

The active role is shown in the Pi footer: `⚒ forge · Role Name`.

Role selection persists across `/reload` and session restarts.

---

## Safety guards

Forge requires explicit confirmation before Pi can:

- **Run a bash command** when the working directory is inside a protected path
- **Write or edit a file** whose path is inside a protected path

Protected paths (matching your `~/dev` and `~/Projects` workflow):

```
~/dev
~/Projects
```

Edit `PROTECTED_DIRS` in `src/index.ts` to change them.

Guards are skipped in non-interactive mode (e.g., `pi --print`) where there is
no UI to confirm with.

---

## Adding a role

Add an entry to the `ROLES` object in `src/roles.ts`:

```typescript
"my-role": {
  label: "My Role",
  description: "One-line description shown in /role list",
  systemPrompt: `You are a ...`,
},
```

Then `/reload` in Pi to pick up the change.
