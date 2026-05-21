import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "../src/extension/context/read-file.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "forge-read-file-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("read-file: reads a normal file successfully", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "index.ts"), "export const x = 1;\n");
    const result = await readFile(dir, "index.ts");

    assert.equal(result.error, undefined);
    assert.equal(result.path, "index.ts");
    assert.match(result.content, /export const x = 1/);
    assert.equal(result.truncated, false);
    assert.ok(result.sizeBytes > 0);
  });
});

test("read-file: reads a file in a subdirectory", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, "src"));
    await writeFile(path.join(dir, "src", "auth.ts"), "export function login() {}\n");
    const result = await readFile(dir, "src/auth.ts");

    assert.equal(result.error, undefined);
    assert.equal(result.path, "src/auth.ts");
    assert.match(result.content, /export function login/);
  });
});

test("read-file: blocks path traversal above repo root", async () => {
  await withTempDir(async (dir) => {
    const result = await readFile(dir, "../../../etc/passwd");

    assert.ok(result.error);
    assert.match(result.error, /outside the repository root/);
    assert.equal(result.content, "");
  });
});

test("read-file: absolute paths are relativized to repo root", async () => {
  await withTempDir(async (dir) => {
    // An absolute path like /etc/passwd has its leading slash stripped,
    // resolving to <root>/etc/passwd — which won't exist. Safe ENOENT.
    const result = await readFile(dir, "/etc/passwd");

    assert.ok(result.error);
    // Either not-found or traversal refusal — either way it doesn't read the system file
    assert.ok(
      result.error.includes("Could not read") || result.error.includes("outside the repository root"),
      `unexpected error: ${result.error}`,
    );
  });
});

test("read-file: refuses secret-like paths (.env)", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, ".env"), "SECRET_TOKEN=do-not-read\n");
    const result = await readFile(dir, ".env");

    assert.ok(result.error);
    assert.match(result.error, /secret-like path/);
    assert.equal(result.content, "");
  });
});

test("read-file: refuses secret-like paths (*.pem)", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "server.pem"), "-----BEGIN CERTIFICATE-----\n");
    const result = await readFile(dir, "server.pem");

    assert.ok(result.error);
    assert.match(result.error, /secret-like path/);
  });
});

test("read-file: refuses secret-like paths (*.tfvars)", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, "infra"));
    await writeFile(path.join(dir, "infra", "prod.tfvars"), "db_password = \"secret\"\n");
    const result = await readFile(dir, "infra/prod.tfvars");

    assert.ok(result.error);
    assert.match(result.error, /secret-like path/);
  });
});

test("read-file: returns error for non-existent file", async () => {
  await withTempDir(async (dir) => {
    const result = await readFile(dir, "does-not-exist.ts");

    assert.ok(result.error);
    assert.match(result.error, /Could not read/);
  });
});

test("read-file: returns error when path is a directory", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, "src"));
    const result = await readFile(dir, "src");

    assert.ok(result.error);
    assert.match(result.error, /not a file/);
  });
});

test("read-file: normalizes Windows-style backslash paths", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, "src"));
    await writeFile(path.join(dir, "src", "util.ts"), "export const y = 2;\n");
    // Pass with backslashes — should still resolve correctly
    const result = await readFile(dir, "src\\util.ts");

    assert.equal(result.error, undefined);
    assert.equal(result.path, "src/util.ts");
    assert.match(result.content, /export const y = 2/);
  });
});

test("read-file: strips leading slashes from path", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "index.ts"), "const z = 3;\n");
    const result = await readFile(dir, "/index.ts");

    // A leading slash that resolves within the root should be allowed
    assert.equal(result.error, undefined);
    assert.match(result.content, /const z = 3/);
  });
});
