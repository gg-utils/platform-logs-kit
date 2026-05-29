/**
 * @fileoverview Reusable launcher parsing and child-process helpers for platform-log UIs.
 *
 * Ink and OpenTUI adapters share the same non-interactive flags and spawned `npx tsx` execution
 * model. This package module owns those reusable mechanics while script entrypoints keep the
 * surface-specific help copy and React/OpenTUI rendering.
 *
 * @testing Node test runner (tsx): npm run platform-logs-kit:test from the repository root runs the package `tsx --test` harness over `packages/platform-logs-kit/src/*.unit.test.ts`, including `ui-launcher.unit.test.ts`, after changes here.
 *
 * @see packages/platform-logs-kit/src/ui-entrypoint.ts - Shared entrypoint resolver that imports `PlatformLogsKit_parseUiLaunchOptions` here to branch help, plain preview, Ink/OpenTUI render, or structured parser errors.
 * @see packages/platform-logs-kit/src/ink-app.tsx - Ink runtime that calls `PlatformLogsKit_spawnNpxTsxStream` and `PlatformLogsKit_spawnNpxTsxOnce` to stream or buffer the `npx tsx` child processes configured from repo-relative script paths.
 * @see scripts/log-tail/ui/cli-ink/launch-options.ts - Root Ink launcher adapter that forwards argv into `PlatformLogsKit_parseUiLaunchOptions` from `@gg-utils/platform-logs-kit/ui-launcher` before bootstrapping the log-tail UI.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

/** Parsed launcher flags shared by the Ink and OpenTUI log-tail wrappers. */
export type PlatformLogsKit_UiLaunchOptions = {
  helpRequested: boolean;
  printPreviewRequested: boolean;
  projectRoot: string;
};

/** Reads the argument value that must follow a flag that takes an operand in `argv`. */
function takeValue(options: {
  argv: readonly string[];
  index: number;
  missingValueMessage: string;
}): { nextIndex: number; value: string } {
  const next = options.argv[options.index + 1];
  if (next === undefined || next.startsWith("-")) {
    throw new Error(options.missingValueMessage);
  }
  return { nextIndex: options.index + 2, value: next };
}

/** Parses shared log-tail UI launch flags from an argv slice. */
export function PlatformLogsKit_parseUiLaunchOptions(options: {
  argv: readonly string[];
  cwd: string;
  errorPrefix: string;
}): PlatformLogsKit_UiLaunchOptions {
  let helpRequested = false;
  let printPreviewRequested = false;
  let projectRoot = options.cwd;

  let index = 0;
  while (index < options.argv.length) {
    const current = options.argv[index];
    if (current === undefined) {
      break;
    }
    if (current === "--help" || current === "-h") {
      helpRequested = true;
      index += 1;
      continue;
    }
    if (current === "--print-preview") {
      printPreviewRequested = true;
      index += 1;
      continue;
    }
    if (current === "--project-root") {
      const consumed = takeValue({
        argv: options.argv,
        index,
        missingValueMessage: `${options.errorPrefix} Missing value after flag.`,
      });
      projectRoot = path.resolve(consumed.value);
      index = consumed.nextIndex;
      continue;
    }
    if (current.startsWith("-")) {
      throw new Error(`${options.errorPrefix} Unknown option: ${current}`);
    }
    throw new Error(`${options.errorPrefix} Unexpected argument: ${current}`);
  }

  return { helpRequested, printPreviewRequested, projectRoot };
}

/** Configuration for stable log-tail UI launcher help text. */
export type PlatformLogsKit_UiHelpTextOptions = {
  debugLine?: string;
  entryLabel: string;
  fallbackLines: readonly string[];
  invocationLines: readonly string[];
  title: string;
  runtimeLine?: string;
};

/** Formats stable help text for log-tail UI launchers. */
export function PlatformLogsKit_formatUiHelpText(
  options: PlatformLogsKit_UiHelpTextOptions,
): string {
  const lines = [
    options.title,
    "",
    "Usage:",
    ...options.invocationLines.map((line) => `  ${line}`),
    "",
  ];

  if (options.runtimeLine !== undefined) {
    lines.push(options.runtimeLine, "");
  }

  lines.push(
    "Options:",
    "  --help           Show this help and exit.",
    "  --print-preview  Print command preview for the default plan and exit (no TUI).",
    "  --project-root   Repo root (default: cwd).",
    "",
    options.entryLabel,
    ...options.fallbackLines.map((line) => `  ${line}`),
  );

  if (options.debugLine !== undefined) {
    lines.push("", options.debugLine);
  }

  return `${lines.join("\n")}\n`;
}

/** Optional stdout/stderr sinks for streamed `npx tsx` children. */
export type PlatformLogsKit_UiSpawnHandlers = {
  onStderrChunk?: (chunk: string) => void;
  onStdoutChunk?: (chunk: string) => void;
};

/** Stream `npx tsx <scriptUnderRepo>` from `repoRoot`; `cancel` terminates the child. */
export function PlatformLogsKit_spawnNpxTsxStream(options: {
  args: readonly string[];
  handlers?: PlatformLogsKit_UiSpawnHandlers;
  repoRoot: string;
  scriptPathUnderRepo: string;
}): { cancel: () => void; child: ChildProcess } {
  const scriptAbs = path.join(options.repoRoot, options.scriptPathUnderRepo);
  const child = spawn("npx", ["tsx", scriptAbs, ...options.args], {
    cwd: options.repoRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk: Buffer | string) => {
    const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    options.handlers?.onStdoutChunk?.(text);
  });
  child.stderr?.on("data", (chunk: Buffer | string) => {
    const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    options.handlers?.onStderrChunk?.(text);
  });

  const cancel = (): void => {
    try {
      child.kill("SIGTERM");
    } catch {
      // Process may already be dead; safe to ignore.
    }
    setTimeout(() => {
      if (!child.killed) {
        try {
          child.kill("SIGKILL");
        } catch {
          // Process may already be dead; safe to ignore.
        }
      }
    }, 1500).unref?.();
  };

  return { cancel, child };
}

/** Runs `npx tsx` once, buffers stdout/stderr until exit, and returns the exit status. */
export function PlatformLogsKit_spawnNpxTsxOnce(options: {
  args: readonly string[];
  repoRoot: string;
  scriptPathUnderRepo: string;
}): Promise<{ status: number; stderr: string; stdout: string }> {
  const scriptAbs = path.join(options.repoRoot, options.scriptPathUnderRepo);
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", scriptAbs, ...options.args], {
      cwd: options.repoRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ status: code ?? 1, stderr, stdout });
    });
  });
}
