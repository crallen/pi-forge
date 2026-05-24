import test from "node:test";
import assert from "node:assert/strict";
import { fetchUrl } from "../src/extension/context/fetch-url.js";
import { braveWebSearch } from "../src/extension/context/web-search.js";

const originalFetch = globalThis.fetch;
const originalBraveApiKey = process.env.BRAVE_API_KEY;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBraveApiKey === undefined) {
    delete process.env.BRAVE_API_KEY;
  } else {
    process.env.BRAVE_API_KEY = originalBraveApiKey;
  }
});

test("braveWebSearch reports missing API key clearly", async () => {
  delete process.env.BRAVE_API_KEY;

  await assert.rejects(
    () => braveWebSearch("pi coding agent", 10),
    /BRAVE_API_KEY.*https:\/\/brave\.com\/search\/api\//,
  );
});

test("braveWebSearch clamps result count before calling Brave", async () => {
  process.env.BRAVE_API_KEY = "test-key";
  let requestedUrl = "";
  globalThis.fetch = (async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({
      query: { original: "pi coding agent" },
      web: { results: [{ title: "Pi", url: "https://pi.dev", description: "Pi docs" }] },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  const result = await braveWebSearch("pi coding agent", 100);

  assert.equal(new URL(requestedUrl).searchParams.get("count"), "20");
  assert.deepEqual(result.results, [{ title: "Pi", url: "https://pi.dev", description: "Pi docs" }]);
});

test("fetchUrl strips HTML to readable text", async () => {
  globalThis.fetch = (async () => new Response(
    "<html><head><style>.x{}</style><script>alert(1)</script></head><body><h1>Title</h1><p>A&nbsp;&amp;&nbsp;B</p></body></html>",
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  )) as typeof fetch;

  const result = await fetchUrl("https://example.com");

  assert.equal(result.ok, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.text, "Title\nA & B");
});

test("fetchUrl caps streamed response bodies", async () => {
  const encoder = new TextEncoder();
  globalThis.fetch = (async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("a".repeat(600 * 1024)));
      controller.close();
    },
  }), { status: 200, headers: { "content-type": "text/plain" } })) as typeof fetch;

  const result = await fetchUrl("https://example.com/large.txt");

  assert.equal(result.truncated, true);
  assert.equal(Buffer.byteLength(result.text, "utf-8"), 512 * 1024);
});

test("fetchUrl records non-2xx responses", async () => {
  globalThis.fetch = (async () => new Response("not found", {
    status: 404,
    headers: { "content-type": "text/plain" },
  })) as typeof fetch;

  const result = await fetchUrl("https://example.com/missing");

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 404);
  assert.equal(result.text, "not found");
});
