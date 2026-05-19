---
name: git-conventions
description: Conventional Commits format, branching model, and git workflow rules for clean version control history.
---

# Git Conventions

You're a pragmatist about commit hygiene. Conventional Commits aren't bureaucracy — they enable real tooling: automated changelogs, semantic release, CI gating on commit type. The format isn't arbitrary; it earns its place.

You don't gatekeep. You don't reject a PR over a missing scope. But you also don't merge garbage like `wip` and `fixes` into the main branch.

## Conventional Commits

Every commit message follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use | Version bump |
|---|---|---|
| `feat` | A new feature or capability | minor |
| `fix` | A bug fix | patch |
| `docs` | Documentation-only changes | none |
| `style` | Formatting, whitespace, semicolons (no code change) | none |
| `refactor` | Code restructuring without behavior change | none |
| `perf` | Performance improvement | patch |
| `test` | Adding or correcting tests | none |
| `build` | Build system or external dependency changes | none |
| `ci` | CI configuration changes | none |
| `chore` | Maintenance tasks that don't modify src or test | none |
| `revert` | Reverts a previous commit | varies |

### Rules

1. **Subject line:** `<type>(scope): description` — max 72 characters, lowercase, imperative mood, no trailing period.
2. **Scope** (optional): The area of the codebase affected. Use consistent scope names within a project — `auth`, `api`, `ui`, `db`. Inconsistent scopes (`auth` here, `authentication` there) make tooling harder.
3. **Body** (optional): Explain WHY the change was made. Wrap at 72 characters. Separate from subject with a blank line.
4. **Footer** (optional): Reference issues (`Closes #42`), note breaking changes, or add metadata (`Co-authored-by: ...`).
5. **Breaking changes:** Add `!` after type/scope (`feat!: remove legacy API`) AND/OR add a `BREAKING CHANGE:` footer with migration instructions.

### Imperative Mood

The subject line completes the sentence: "If applied, this commit will..."

- ✅ `fix: prevent race condition in session cleanup`
- ❌ `fix: fixed race condition` (past tense)
- ❌ `fix: fixes race condition` (third person)
- ❌ `fix: race condition fix` (noun phrase)

### Examples

```
feat(auth): add OAuth2 login with Google provider

Adds Google as an OAuth2 identity provider alongside the existing
GitHub provider. Users can now link their Google account from the
settings page.

Closes #128
```

```
fix: prevent race condition in session cleanup

The session cleanup goroutine could access the session map
concurrently with request handlers. Use sync.RWMutex instead
of the unsynchronized map access.
```

```
feat!: change API response format to JSON:API spec

BREAKING CHANGE: All API endpoints now return responses in JSON:API
format. The previous flat JSON format is no longer supported.
Clients must update their response parsing logic.

Migration guide: https://example.com/migration
```

```
chore: update dependencies to latest patch versions
```

## Branching Model

### Branch Naming

```
<type>/<short-description>
```

Examples:
- `feat/user-auth`
- `fix/null-pointer-login`
- `chore/update-deps`
- `docs/api-reference`
- `release/v1.2.0`

Branch names are kebab-case. Branch type matches commit type. Description is short — the PR title is where the prose goes.

### Branch Rules

- **`main` / `master` is always deployable.** Never commit directly to it. Even for tiny fixes, go through a PR.
- **Feature branches branch from and merge back to the main development branch.**
- **Delete branches after merging.** Stale branches accumulate and confuse future-you.
- **Keep branches short-lived.** Long-lived branches cause merge conflicts. Anything older than a week is a smell.

## Commit Hygiene

- **One logical change per commit.** Atomic commits are easier to review, revert, and bisect. A commit that fixes a bug, refactors a helper, and updates docs is three commits.
- **Don't mix formatting changes with functional changes.** Reformatting and behavior changes in the same commit hide real changes in the noise.
- **Don't commit generated files**, build artifacts, or IDE configuration. That's what `.gitignore` is for.
- **Never commit secrets, credentials, or private keys.** If you do, rotate immediately — assume the secret is compromised the moment it's pushed.
- **Use `git commit --fixup`** for follow-up corrections to recent commits, then squash before merging.

## When to Squash vs. Preserve History

| Situation | Action |
|---|---|
| PR with one logical change spread across many WIP commits | Squash on merge |
| PR with multiple distinct logical changes | Preserve history (rebase to clean it up) |
| Hotfix or small targeted change | Single commit, no need to squash |
| Long-running feature with milestones | Preserve history |

**The question:** would the bisected history be more useful as one big commit or as several smaller ones? Optimize for the future debugger.

## Pull Request Conventions

- PR title follows Conventional Commits format (it becomes the commit message on squash-merge).
- PR description explains **why** the change is needed and **what** it does at a high level.
- Link the issue or spec the PR resolves.
- Include screenshots or test output where they help reviewers.
- Keep PRs small. 200-400 lines is a sweet spot. 2000-line PRs don't get reviewed; they get rubber-stamped.

## Anti-Patterns

- **`fixes` / `wip` / `update` as commit messages.** These are signals you haven't actually decided what the commit is for.
- **Commits that fix the previous commit's mistakes.** Squash them. `git commit --amend` is your friend.
- **Reverts of reverts of reverts.** Indicates an unstable change that should have been a feature flag.
- **Mixed-purpose commits.** "Add user model, fix auth bug, update CI config." That's three commits.
- **Force-pushing to shared branches.** Destroys other people's work. Rebase locally, force-push only your own branches.
- **`Merge branch 'main'`** commits cluttering history. Use rebase or merge with `--ff-only` when possible.
