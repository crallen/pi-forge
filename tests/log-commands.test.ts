import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";
import { collectGitLog, resolveLastTag } from "../src/extension/context/git-log.js";
import { buildStandupPrompt } from "../src/extension/prompt-builders/standup-prompt.js";
import { buildChangelogPrompt } from "../src/extension/prompt-builders/changelog-prompt.js";

const execFileAsync = promisify(execFile);

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "forge-log-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function run(command: string, args: string[], cwd: string) {
  const result = await execFileAsync(command, args, { cwd });
  return { code: 0, stdout: result.stdout, stderr: result.stderr };
}

function fakePi() {
  return {
    async exec(command: string, args: string[], options: { cwd: string }) {
      try {
        return await run(command, args, options.cwd);
      } catch (err: any) {
        return { code: err.code ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? String(err) };
      }
    },
  };
}

async function makeRepo(dir: string) {
  await run("git", ["init", "-q"], dir);
  await run("git", ["config", "user.email", "forge-test@example.com"], dir);
  await run("git", ["config", "user.name", "Forge Test"], dir);
}

// --- collectGitLog ---

test("git log: collects commits since a date", async () => {
  await withTempDir(async (dir) => {
    await makeRepo(dir);
    await writeFile(path.join(dir, "a.ts"), "const a = 1;\n");
    await run("git", ["add", "a.ts"], dir);
    await run("git", ["commit", "-qm", "feat: add a"], dir);
    await writeFile(path.join(dir, "b.ts"), "const b = 2;\n");
    await run("git", ["add", "b.ts"], dir);
    await run("git", ["commit", "-qm", "fix: fix b"], dir);

    const log = await collectGitLog(fakePi() as any, dir, "1 week ago");

    assert.ok(log.entries.length >= 2);
    assert.ok(log.entries.some((e) => e.subject === "feat: add a"));
    assert.ok(log.entries.some((e) => e.subject === "fix: fix b"));
    assert.equal(log.errors.length, 0);
    assert.equal(log.truncated, false);
  });
});

test("git log: collects commits since a ref", async () => {
  await withTempDir(async (dir) => {
    await makeRepo(dir);
    await writeFile(path.join(dir, "base.ts"), "const base = 0;\n");
    await run("git", ["add", "base.ts"], dir);
    await run("git", ["commit", "-qm", "chore: base commit"], dir);
    await run("git", ["tag", "v0.1.0"], dir);
    await writeFile(path.join(dir, "feature.ts"), "const feature = 1;\n");
    await run("git", ["add", "feature.ts"], dir);
    await run("git", ["commit", "-qm", "feat: new feature"], dir);

    const log = await collectGitLog(fakePi() as any, dir, "v0.1.0");

    assert.equal(log.entries.length, 1);
    assert.equal(log.entries[0]?.subject, "feat: new feature");
  });
});

test("git log: returns error for non-git directory", async () => {
  await withTempDir(async (dir) => {
    const log = await collectGitLog(fakePi() as any, dir, "yesterday");

    assert.equal(log.entries.length, 0);
    assert.ok(log.errors.length > 0);
    assert.match(log.errors[0]!, /Not a git repository/);
  });
});

test("git log: resolveLastTag returns tag when present", async () => {
  await withTempDir(async (dir) => {
    await makeRepo(dir);
    await writeFile(path.join(dir, "init.ts"), "export {};\n");
    await run("git", ["add", "init.ts"], dir);
    await run("git", ["commit", "-qm", "chore: init"], dir);
    await run("git", ["tag", "v1.2.3"], dir);

    const tag = await resolveLastTag(fakePi() as any, dir);
    assert.equal(tag, "v1.2.3");
  });
});

test("git log: resolveLastTag returns undefined when no tags", async () => {
  await withTempDir(async (dir) => {
    await makeRepo(dir);
    await writeFile(path.join(dir, "init.ts"), "export {};\n");
    await run("git", ["add", "init.ts"], dir);
    await run("git", ["commit", "-qm", "chore: init"], dir);

    const tag = await resolveLastTag(fakePi() as any, dir);
    assert.equal(tag, undefined);
  });
});

// --- standup prompt ---

test("standup prompt: contains expected instructions and log data", async () => {
  const log = {
    entries: [
      { hash: "abc1234", subject: "feat: add auth", author: "Dev", date: "2026-05-21" },
      { hash: "def5678", subject: "fix: login bug", author: "Dev", date: "2026-05-21" },
    ],
    since: "yesterday",
    root: "/repo",
    branch: "main",
    truncated: false,
    errors: [],
  };

  const prompt = buildStandupPrompt(log);

  assert.match(prompt, /standup/i);
  assert.match(prompt, /first person/);
  assert.match(prompt, /feat: add auth/);
  assert.match(prompt, /fix: login bug/);
  assert.match(prompt, /yesterday/);
  assert.match(prompt, /Do not modify any files/);
});

test("standup prompt: handles empty log", () => {
  const log = {
    entries: [],
    since: "yesterday",
    root: "/repo",
    branch: "main",
    truncated: false,
    errors: [],
  };

  const prompt = buildStandupPrompt(log);
  assert.match(prompt, /no commits found/);
});

// --- changelog prompt ---

test("changelog prompt: contains Keep a Changelog sections and log data", async () => {
  const log = {
    entries: [
      { hash: "abc1234", subject: "feat: add auth module", author: "Dev", date: "2026-05-21" },
      { hash: "def5678", subject: "fix: null pointer in login", author: "Dev", date: "2026-05-20" },
    ],
    since: "v1.0.0",
    root: "/repo",
    branch: "main",
    truncated: false,
    errors: [],
  };

  const prompt = buildChangelogPrompt(log, "1.1.0");

  assert.match(prompt, /Keep a Changelog/);
  assert.match(prompt, /Added.*Changed.*Deprecated.*Removed.*Fixed.*Security/s);
  assert.match(prompt, /1\.1\.0/);
  assert.match(prompt, /feat: add auth module/);
  assert.match(prompt, /fix: null pointer in login/);
  assert.match(prompt, /Do not modify any files/);
});

test("changelog prompt: uses Unreleased when no version given", () => {
  const log = {
    entries: [{ hash: "abc1234", subject: "feat: something", author: "Dev", date: "2026-05-21" }],
    since: "v1.0.0",
    root: "/repo",
    branch: "main",
    truncated: false,
    errors: [],
  };

  const prompt = buildChangelogPrompt(log);
  assert.match(prompt, /\[Unreleased\]/);
});

test("changelog prompt: surfaces collection errors", () => {
  const log = {
    entries: [],
    since: "v1.0.0",
    root: "/repo",
    branch: "main",
    truncated: false,
    errors: ["git log failed: fatal error"],
  };

  const prompt = buildChangelogPrompt(log, "1.1.0");
  assert.match(prompt, /git log failed/);
});
