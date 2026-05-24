# Context Format

Use this format for project domain language. Keep it short, opinionated, and easy to scan.

## Root file

For a single-context repo, create `CONTEXT.md` at the repository root.

```md
# Project context

One sentence describing the domain this language belongs to.

## Language

**Canonical term**:
One or two sentences defining what this thing is in this project.
_Avoid_: ambiguous synonym, overloaded word

**Another term**:
Definition.

## Relationships

- A **Workspace** contains many **Projects**.
- A **Project** belongs to exactly one **Workspace**.

## Flagged ambiguities

- "Environment" previously meant both deploy target and local shell variables — resolved: use **Deploy environment** for targets and **Environment variables** for shell/process configuration.
```

## Term entries

Each term should include:

- **Canonical name** in bold.
- A tight definition of what the thing is.
- `_Avoid_:` aliases only when they are likely to cause confusion.
- Relationship notes when cardinality or ownership matters.

Write definitions as if they will guide names in code.

Good:

```md
**Workspace**:
A customer-owned collaboration boundary that contains projects, members, and billing configuration.
_Avoid_: organization, account
```

Weak:

```md
**Workspace**:
A workspace lets users manage their work and collaborate with other people.
```

The weak version describes behavior but doesn't define the concept.

## Relationships

Use relationships when they prevent future ambiguity:

```md
## Relationships

- A **Customer** owns one or more **Workspaces**.
- A **Workspace** contains many **Projects**.
- A **Project** belongs to exactly one **Workspace**.
```

Skip relationships that are obvious or unstable.

## Flagged ambiguities

Use this section for language decisions that resolved confusion:

```md
## Flagged ambiguities

- "Account" was used for both login identity and paying customer — resolved: use **User** for login identity and **Customer** for billing owner.
```

This section is often the most valuable part of the file. It stops old ambiguity from coming back.

## Multi-context repos

When one glossary becomes confusing because terms mean different things in different areas, create `CONTEXT-MAP.md` at the root:

```md
# Context map

- Billing: `src/billing/CONTEXT.md`
- Provisioning: `src/provisioning/CONTEXT.md`
- Console UI: `src/console/CONTEXT.md`
```

Each linked context file uses the same format as root `CONTEXT.md`.

## Example dialogue

Use canonical terms naturally once they exist:

> The **Workspace** owns billing, so this permission should be checked at the workspace boundary, not on each project.

Challenge conflicting usage:

> You called this an "account", but `CONTEXT.md` reserves **Customer** for billing ownership and **User** for login identity. Which one is this?
