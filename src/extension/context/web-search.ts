export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface BraveSearchResponse {
  query: string;
  results: BraveSearchResult[];
}

export async function braveWebSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "forge_web_search requires a BRAVE_API_KEY environment variable. " +
        "Get a free key at https://brave.com/search/api/",
    );
  }

  const safeCount = Math.min(20, Math.max(1, count));

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(safeCount));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Brave Search API error: HTTP ${response.status}${body ? ` — ${body}` : ""}`);
  }

  const data = (await response.json()) as {
    web?: {
      results?: Array<{
        title?: string;
        url?: string;
        description?: string;
      }>;
    };
    query?: { original?: string };
  };

  const results: BraveSearchResult[] = (data.web?.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    description: r.description ?? "",
  }));

  return {
    query: data.query?.original ?? query,
    results,
  };
}
