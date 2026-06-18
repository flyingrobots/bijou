import { execFileSync } from "node:child_process";

export function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

export function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]);
}

export function stagedFiles() {
  const output = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  return output.length === 0 ? [] : output.split("\n").filter(Boolean);
}

export function trackedFiles() {
  const output = git(["ls-files"]);
  return output.length === 0 ? [] : output.split("\n").filter(Boolean);
}

export function untrackedFiles() {
  const output = git(["ls-files", "--others", "--exclude-standard"]);
  return output.length === 0 ? [] : output.split("\n").filter(Boolean);
}

export function allWorkspaceFiles() {
  return [...new Set([...trackedFiles(), ...untrackedFiles()])].sort();
}

export function stagedContent(file) {
  try {
    return git(["show", `:${file}`]);
  } catch {
    return "";
  }
}
