export interface RoleDef {
  label: string;
  description: string;
  primary?: boolean;
}

export const ROLES: Record<string, RoleDef> = {
  "tech-lead": {
    label: "Tech Lead",
    description: "General-purpose implementation and coordination; reaches for task-focused skills when deep domain work is needed",
    primary: true,
  },
  architect: {
    label: "Architect",
    description: "High-level design, architectural decisions, and structural planning — no implementation",
    primary: true,
  },
  none: {
    label: "None",
    description: "No role — Pi's default behavior",
  },
};

export const DEFAULT_ROLE = "tech-lead";

export const PRIMARY_ROLE_KEYS = Object.keys(ROLES).filter((k) => ROLES[k].primary);
export const SPECIALIST_ROLE_KEYS = Object.keys(ROLES).filter((k) => !ROLES[k].primary);
export const ROLE_KEYS = [...PRIMARY_ROLE_KEYS, ...SPECIALIST_ROLE_KEYS];
