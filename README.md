# pi-forge

A [Pi](https://github.com/earendil-works/pi-coding-agent) extension that brings
role-based AI personas to your dev workflow, plus confirmation guards for
writes and shell commands in your project directories.

Switch roles to steer the model's behavior for the task at hand — planning,
architecture, implementation, review, and so on — without leaving Pi or
managing separate sessions.

---

## Requirements

- [Pi](https://github.com/earendil-works/pi-coding-agent) coding agent

---

## Install

Clone the repo:

```bash
git clone https://github.com/callen/pi-forge.git ~/dev/pi-forge
```

Add it to your Pi settings (`~/.pi/agent/settings.json`):

```json
{
  "extensions": ["/absolute/path/to/pi-forge"]
}
```

No build step needed. Pi loads TypeScript directly.

---

## Commands

### `/role [name]`

Switch the active role. Run with no argument to see what's available and
what's currently active.

```
/role             — list roles, show active one
/role architect   — switch to Architect
/role none        — clear role, use Pi's default behavior
```

Tab completion works for role names.

### `/forge`

Show extension status: active role and protected directories.

---

## Roles

| Name | What it does |
|---|---|
| `none` | Pi's default behavior, no persona applied |
| `tech-lead` | Breaks down complex requests, coordinates specialist roles |
| `architect` | High-level design, patterns, ADRs — no implementation code |
| `spec` | Turns vague requests into requirements with acceptance criteria |
| `implementer` | Precise backend coding, strict scope adherence |
| `frontend` | Components, styling, accessibility, responsive design |
| `db` | Schema design, migrations, query optimization |
| `devops` | CI/CD, Docker, Kubernetes/Helm, infrastructure-as-code |
| `docs` | Concise technical documentation with a relaxed tone |
| `reviewer` | Read-only code quality review with classified findings |
| `auditor` | Read-only security review with severity classification |
| `tester` | Test coverage: writing, executing, diagnosing failures |
| `planner` | Breaks overwhelming work into time-boxed sequential tasks |

The active role is shown in the Pi footer: `⚒ forge · Role Name`.

Role selection persists across `/reload` and session restarts.

---

## Safety guards

Forge prompts for confirmation before Pi can:

- **Run a bash command** when the working directory is inside a protected path
- **Write or edit a file** whose path is inside a protected path

The defaults are `~/dev` and `~/Projects`. To change them, edit `PROTECTED_DIRS`
in `src/index.ts`.

Guards are skipped in non-interactive mode (e.g. `pi --print`) where there is
no UI to confirm with.

---

## Adding a role

Add an entry to `ROLES` in `src/roles.ts`:

```typescript
"my-role": {
  label: "My Role",
  description: "One-line description shown in /role list",
  systemPrompt: `You are a ...`,
},
```

Then `/reload` in Pi to pick up the change.

---

## License

MIT
