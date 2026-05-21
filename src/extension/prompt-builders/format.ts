export function section(title: string, ...content: Array<string | false | undefined>): string {
  return [`## ${title}`, "", ...content.filter((item): item is string => Boolean(item))].join("\n");
}

export function subsection(title: string, ...content: Array<string | false | undefined>): string {
  return [`### ${title}`, "", ...content.filter((item): item is string => Boolean(item))].join("\n");
}

export function list(items: string[], empty = "(none)"): string {
  if (items.length === 0) return empty;
  return items.map((item) => `- ${item}`).join("\n");
}

export function recordList(items: Record<string, string>, empty = "(none)"): string {
  const entries = Object.entries(items);
  if (entries.length === 0) return empty;
  return entries.map(([key, value]) => `- ${key}: ${value}`).join("\n");
}

export function fenced(text: string): string {
  return ["```", text, "```"].join("\n");
}
