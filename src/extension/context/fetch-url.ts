const MAX_BYTES = 512 * 1024; // 512 KB cap before stripping

export interface FetchUrlResult {
  url: string;
  statusCode: number;
  ok: boolean;
  contentType: string;
  text: string;
  truncated: boolean;
}

/**
 * Fetches a URL and returns its content as plain text.
 * HTML is stripped to reduce noise; other content types are returned as-is.
 */
export async function fetchUrl(url: string, signal?: AbortSignal): Promise<FetchUrlResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; pi-forge/1.0; +https://pi.dev)",
    },
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = await readLimitedBody(response, MAX_BYTES);
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(body.bytes);
  const text = contentType.includes("text/html") ? stripHtml(raw) : raw;

  return {
    url: response.url,
    statusCode: response.status,
    ok: response.ok,
    contentType,
    text,
    truncated: body.truncated,
  };
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!response.body) {
    return { bytes: new Uint8Array(), truncated: false };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;

      const remaining = maxBytes - total;
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        total += remaining;
        truncated = true;
        await reader.cancel();
        break;
      }

      chunks.push(value);
      total += value.byteLength;
    }

    if (!truncated && total >= maxBytes) {
      const { done } = await reader.read();
      truncated = !done;
      if (truncated) await reader.cancel();
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { bytes, truncated };
}

function stripHtml(html: string): string {
  return html
    // Remove script and style blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Replace block-level elements with newlines
    .replace(/<\/?(p|div|section|article|header|footer|h[1-6]|li|tr|br)[^>]*>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse excess whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
