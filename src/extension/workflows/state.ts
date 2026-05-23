import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const WORKFLOW_STATE_TYPE = "forge.workflow_state";

export type WorkflowKind = "dev" | "debug" | "test" | "review" | "security" | "release";
export type WorkflowStatus = "active" | "planning" | "implementing" | "blocked" | "verifying" | "ready-for-review" | "complete" | "abandoned";
export type StepStatus = "todo" | "doing" | "done" | "blocked" | "skipped";
export type CheckStatus = "passed" | "failed" | "skipped" | "cancelled";

export interface ForgeWorkflowState {
  schemaVersion: 1;
  id: string;
  kind: WorkflowKind;
  status: WorkflowStatus;
  goal: string;
  createdAt: number;
  updatedAt: number;
  repoRoot: string;
  branch?: string;
  plan: Array<{ id: string; text: string; status: StepStatus }>;
  decisions: Array<{ text: string; timestamp: number }>;
  filesTouched: string[];
  checksRun: Array<{
    command: string;
    cwd: string;
    status: CheckStatus;
    exitCode?: number;
    durationMs?: number;
    summary?: string;
    timestamp: number;
  }>;
  risks: string[];
  nextSteps: string[];
  previousWorkflowId?: string;
}

export function createWorkflowState(args: { kind: WorkflowKind; goal: string; repoRoot: string; branch?: string; previousWorkflowId?: string }): ForgeWorkflowState {
  const now = Date.now();
  return {
    schemaVersion: 1,
    id: `wf-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind: args.kind,
    status: "active",
    goal: args.goal.trim() || "Current repository work",
    createdAt: now,
    updatedAt: now,
    repoRoot: args.repoRoot,
    branch: args.branch,
    plan: [],
    decisions: [],
    filesTouched: [],
    checksRun: [],
    risks: [],
    nextSteps: [],
    previousWorkflowId: args.previousWorkflowId,
  };
}

export function appendWorkflowState(pi: ExtensionAPI, state: ForgeWorkflowState): ForgeWorkflowState {
  const updated = { ...state, updatedAt: Date.now() };
  pi.appendEntry(WORKFLOW_STATE_TYPE, updated);
  return updated;
}

export function updateWorkflowState(pi: ExtensionAPI, state: ForgeWorkflowState, patch: Partial<ForgeWorkflowState>): ForgeWorkflowState {
  return appendWorkflowState(pi, { ...state, ...patch, id: state.id, schemaVersion: 1, createdAt: state.createdAt });
}

export function restoreActiveWorkflow(entries: unknown[]): ForgeWorkflowState | undefined {
  const states = entries
    .map((entry) => parseWorkflowEntry(entry))
    .filter((state): state is ForgeWorkflowState => state !== undefined)
    .sort((a, b) => a.updatedAt - b.updatedAt);

  return states.reverse().find((state) => !isTerminalStatus(state.status));
}

export function isTerminalStatus(status: WorkflowStatus): boolean {
  return status === "complete" || status === "abandoned";
}

export function formatWorkflowState(state: ForgeWorkflowState): string {
  return [
    `Workflow: ${state.id}`,
    `Status: ${state.status}`,
    `Kind: ${state.kind}`,
    `Goal: ${state.goal}`,
    `Repo: ${state.repoRoot}`,
    state.branch ? `Branch: ${state.branch}` : undefined,
    "",
    "Plan:",
    ...(state.plan.length > 0 ? state.plan.map((step) => `- [${step.status}] ${step.text}`) : ["- (none recorded)"]),
    "",
    "Recent decisions:",
    ...(state.decisions.slice(-5).map((decision) => `- ${decision.text}`)),
    ...(state.decisions.length === 0 ? ["- (none recorded)"] : []),
    "",
    "Files touched:",
    ...(state.filesTouched.length > 0 ? state.filesTouched.map((file) => `- ${file}`) : ["- (none recorded)"]),
    "",
    "Checks run:",
    ...(state.checksRun.length > 0 ? state.checksRun.slice(-5).map((check) => `- ${check.status}: ${check.command}${check.summary ? ` — ${check.summary}` : ""}`) : ["- (none recorded)"]),
    "",
    "Risks:",
    ...(state.risks.length > 0 ? state.risks.map((risk) => `- ${risk}`) : ["- (none recorded)"]),
    "",
    "Next steps:",
    ...(state.nextSteps.length > 0 ? state.nextSteps.map((step) => `- ${step}`) : ["- (none recorded)"]),
  ].filter((line): line is string => line !== undefined).join("\n");
}

export function workflowStatusText(state: ForgeWorkflowState): string {
  return `⚒ ${state.kind}: ${state.goal.slice(0, 40)}${state.goal.length > 40 ? "…" : ""}`;
}

function parseWorkflowEntry(entry: unknown): ForgeWorkflowState | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  const candidate = entry as { type?: string; customType?: string; data?: unknown };
  if (candidate.type !== "custom" || candidate.customType !== WORKFLOW_STATE_TYPE) return undefined;
  if (!candidate.data || typeof candidate.data !== "object") return undefined;
  const data = candidate.data as Partial<ForgeWorkflowState>;
  if (data.schemaVersion !== 1 || typeof data.id !== "string" || typeof data.updatedAt !== "number") return undefined;
  return data as ForgeWorkflowState;
}
