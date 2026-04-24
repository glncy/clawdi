import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, statSync, symlinkSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { minimatch } from "minimatch";

import { loadProjectConfig } from "./project-config.js";

type WorktreeEntry = {
  path: string;
  branch?: string; // undefined for detached HEAD worktrees
};

function listWorktrees(cwd: string): WorktreeEntry[] {
  const output = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  const worktrees: WorktreeEntry[] = [];
  let current: Partial<WorktreeEntry> = {};

  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice(9).trim() };
    } else if (line.startsWith("branch ")) {
      current.branch = line.slice(7).trim();
    } else if (line === "" && current.path) {
      worktrees.push({ path: current.path, branch: current.branch });
      current = {};
    }
  }

  if (current.path) {
    worktrees.push({ path: current.path, branch: current.branch });
  }

  return worktrees;
}

// First entry in git worktree list is always the main checkout
function getMainRepoRoot(cwd: string): string {
  const worktrees = listWorktrees(cwd);
  const main = worktrees[0];
  if (!main) throw new Error("Could not determine main repo root from git worktree list.");
  return main.path;
}

function resolveWorktreePath(
  mainRoot: string,
  cwd: string,
  target: string | undefined,
): string | null {
  if (!target) {
    const resolvedCwd = resolve(cwd);
    if (resolvedCwd === mainRoot) {
      throw new Error(
        "Run this from inside a worktree, or pass a worktree name: bun run setup-worktree <name>",
      );
    }
    return resolvedCwd;
  }

  if (existsSync(target)) {
    return resolve(target);
  }

  const worktrees = listWorktrees(mainRoot);
  const match = worktrees.find(
    (wt) =>
      wt.path === target ||
      basename(wt.path) === target ||
      (wt.branch &&
        (wt.branch === target ||
          wt.branch === `refs/heads/${target}` ||
          basename(wt.branch) === target)),
  );

  return match?.path ?? null;
}

function resolveGlobPatterns(mainRoot: string, patterns: string[]): string[] {
  if (patterns.length === 0) return [];
  const results: string[] = [];
  const seen = new Set<string>();

  function scan(relDir: string) {
    const absDir = join(mainRoot, relDir);
    let entries: string[];
    try {
      entries = readdirSync(absDir);
    } catch {
      return;
    }
    for (const name of entries) {
      const relPath = relDir ? `${relDir}/${name}` : name;
      for (const pattern of patterns) {
        if (!seen.has(relPath) && minimatch(relPath, pattern, { dot: true })) {
          seen.add(relPath);
          results.push(relPath);
          break;
        }
      }
      try {
        if (statSync(join(mainRoot, relPath)).isDirectory()) {
          scan(relPath);
        }
      } catch {
        // skip unreadable entries
      }
    }
  }

  scan("");
  return results;
}

type LinkResult = "linked" | "skipped" | "missing";

function linkPath(src: string, dst: string): LinkResult {
  if (!existsSync(src)) return "missing";
  // lstatSync (not existsSync) so broken symlinks at dst are detected as
  // "already present" and left in place rather than double-linked.
  try {
    lstatSync(dst);
    return "skipped";
  } catch {
    symlinkSync(src, dst, "dir");
    return "linked";
  }
}

export type SetupWorktreeOptions = {
  cwd: string;
  target?: string;
  verbose?: boolean;
};

export type SetupWorktreeResult = {
  worktreePath: string;
  linked: string[];
  skipped: string[];
  missing: string[];
};

export async function setupWorktree({
  cwd,
  target,
  verbose = false,
}: SetupWorktreeOptions): Promise<SetupWorktreeResult> {
  const mainRoot = getMainRepoRoot(cwd);
  const worktreePath = resolveWorktreePath(mainRoot, cwd, target);

  if (!worktreePath) {
    throw new Error(
      `Could not find worktree for '${target}'. Run 'git worktree list' to see available worktrees.`,
    );
  }

  if (worktreePath === mainRoot) {
    throw new Error("Target resolves to the main repo — nothing to link.");
  }

  // Install dependencies in the worktree
  const install = spawnSync("bun", ["install"], {
    cwd: worktreePath,
    stdio: "inherit",
  });
  if (install.status !== 0) {
    throw new Error("bun install failed in worktree.");
  }

  const linked: string[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];

  function link(relPath: string) {
    const result = linkPath(join(mainRoot, relPath), join(worktreePath!, relPath));
    if (result === "linked") linked.push(relPath);
    if (result === "skipped") skipped.push(relPath);
    if (result === "missing" && verbose) missing.push(relPath);
  }

  // Extra symlinks from scripts.config.ts
  try {
    const config = await loadProjectConfig(mainRoot);
    const patterns = config["setup-worktree"]?.symlinks ?? [];
    for (const relPath of resolveGlobPatterns(mainRoot, patterns)) {
      link(relPath);
    }
  } catch {
    // scripts.config.ts missing or unreadable — skip extra symlinks
  }

  return { worktreePath, linked, skipped, missing };
}
