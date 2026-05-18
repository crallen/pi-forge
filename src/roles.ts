import * as fs from "node:fs";
import * as path from "node:path";

export interface RoleDef {
  label: string;
  description: string;
  systemPrompt: string;
}

function loadPrompt(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "prompts", `${name}.md`),
    "utf-8",
  ).trim();
}

export const ROLES: Record<string, RoleDef> = {
  none: {
    label: "None",
    description: "No role — Pi's default behavior",
    systemPrompt: "",
  },
  "tech-lead": {
    label: "Tech Lead",
    description: "Orchestrates complex workflows; breaks down requests and coordinates specialist roles",
    systemPrompt: loadPrompt("tech-lead"),
  },
  architect: {
    label: "Architect",
    description: "High-level technical design, architectural decisions, and structural planning — no implementation code",
    systemPrompt: loadPrompt("architect"),
  },
  spec: {
    label: "Spec",
    description: "Transforms vague requests into precise, actionable requirements with acceptance criteria and edge cases",
    systemPrompt: loadPrompt("spec"),
  },
  implementer: {
    label: "Implementer",
    description: "Precise backend coding with strict scope adherence and zero architectural drift",
    systemPrompt: loadPrompt("implementer"),
  },
  frontend: {
    label: "Frontend",
    description: "UI components, styling, accessibility, responsive design, and browser-specific concerns",
    systemPrompt: loadPrompt("frontend"),
  },
  db: {
    label: "DB Specialist",
    description: "Schema design, migrations, query optimization, and indexing strategy",
    systemPrompt: loadPrompt("db"),
  },
  devops: {
    label: "DevOps",
    description: "CI/CD pipelines, Docker, Kubernetes/Helm, infrastructure-as-code, and deployment automation",
    systemPrompt: loadPrompt("devops"),
  },
  docs: {
    label: "Docs Writer",
    description: "Technical documentation: READMEs, API docs, guides, changelogs, and inline comments",
    systemPrompt: loadPrompt("docs"),
  },
  reviewer: {
    label: "Code Reviewer",
    description: "Read-only code quality review: correctness, maintainability, readability, and project convention adherence",
    systemPrompt: loadPrompt("reviewer"),
  },
  auditor: {
    label: "Security Auditor",
    description: "Read-only security review: vulnerabilities, severity classification, and actionable remediation",
    systemPrompt: loadPrompt("auditor"),
  },
  tester: {
    label: "Tester",
    description: "Comprehensive test coverage: writing, executing, diagnosing failures, and verifying fixes",
    systemPrompt: loadPrompt("tester"),
  },
  planner: {
    label: "Planner",
    description: "Breaks overwhelming complexity into crystal-clear, sequential, time-boxed action items",
    systemPrompt: loadPrompt("planner"),
  },
};

export const DEFAULT_ROLE = "none";

export const ROLE_KEYS = Object.keys(ROLES);
