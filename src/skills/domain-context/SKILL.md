---
name: domain-context
description: Build and maintain a project domain glossary (CONTEXT.md), resolve overloaded terminology, and keep agent vocabulary aligned with the codebase and team language.
---

# Domain Context

Use this skill to build and maintain the project's shared language. A good `CONTEXT.md` makes future work faster: names stay consistent, conversations get shorter, and the agent stops inventing synonyms for concepts the project already understands.

This is not a documentation ceremony. Create and update context only when language has been resolved and will matter again.

## When to Use This Skill

Load this skill when:

- The user says "define the language", "update the glossary", "add this to CONTEXT.md", or similar.
- A task turns on ambiguous, overloaded, or conflicting domain terms.
- You notice the user, codebase, and docs using different words for the same concept.
- A spec, grilling session, or ADR produces terminology that future work should preserve.

Do not load this skill for ordinary programming terms. `Component`, `handler`, `database`, and `API` are not domain language unless this project gives them specific meanings.

## Read Existing Context First

Before changing domain language:

1. Check for `CONTEXT.md` at the repo root.
2. Check for `CONTEXT-MAP.md` if the repo has multiple bounded contexts or domains.
3. Read the relevant context file before proposing names.
4. Use existing vocabulary in conversation, code, specs, tests, and docs.

If no context file exists, don't create one just because the skill loaded. Create it lazily when the first meaningful term is resolved.

## Maintain Context Inline

When terminology is resolved, update the context artifact immediately. Don't keep a private list to batch later; that loses the decision while it is fresh.

Good context updates:

- Capture the canonical term.
- Define what the term **is**, not every thing it does.
- Record aliases to avoid when they caused confusion.
- Note relationships or cardinality when they clarify usage.
- Flag resolved ambiguity explicitly.

Bad context updates:

- Restate generic programming knowledge.
- Add marketing language.
- Add terms nobody will use again.
- Invent taxonomy before the project needs it.

## Challenge Conflicts

If new language conflicts with existing context, stop and surface it.

> `CONTEXT.md` defines **Workspace** as the customer-owned collaboration boundary, but this request seems to use "workspace" as a local folder. Should we use **Project folder** for the local concept to avoid collision?

Prefer preserving established terms unless the user explicitly decides to rename or split them.

## Single vs. Multi-Context Repos

Use one root `CONTEXT.md` when the repo has one dominant domain language.

Use `CONTEXT-MAP.md` when the repo contains separate bounded contexts with conflicting or independent vocabulary. The map should point to context files near their owning code, such as:

```md
# Context map

- Billing: `src/billing/CONTEXT.md`
- Provisioning: `src/provisioning/CONTEXT.md`
```

Don't introduce multi-context structure preemptively. Start with root `CONTEXT.md`; split only when one glossary becomes confusing.

## ADR Awareness

Some language decisions are architectural decisions in disguise. Offer an ADR only when all three gates pass:

1. **Hard to reverse** — changing the decision later has meaningful cost.
2. **Surprising without context** — a future reader will wonder why this path was chosen.
3. **Real trade-off** — there were credible alternatives and one was chosen for a reason.

If the gates pass, suggest a lightweight ADR in `docs/adr/0001-slug.md` style. An ADR can be one paragraph: context, decision, and why.

## Reference

Read `reference/context-format.md` when creating or substantially restructuring `CONTEXT.md` or `CONTEXT-MAP.md`.
