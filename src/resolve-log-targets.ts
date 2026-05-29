/**
 * @fileoverview Resolves configured log files that log-tail UIs inspect for view plans.
 *
 * Flow: project config + plan -> scope/run-index -> resolved log files -> snapshot surfaces.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/snapshot.ts - Snapshot reader that consumes file lists.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import fs from "node:fs";
import path from "node:path";
import {
  logTail_resolveLatestLogFile,
  logTail_resolveNthNewestMatchingFile,
} from "@gg-utils/platform-logs-core/discover-log-files";
import type {
  LogTailUiPlan,
  LogTailUiSource,
  PlatformLogsKit_Config,
  PlatformLogsKit_SourceConfig,
} from "./types.js";
import {
  platformLogsKitFindScope,
  platformLogsKitFindSource,
} from "./types.js";

/** Pushes `absolutePath` only when it exists and is a regular file. */
function appendIfFile(files: string[], absolutePath: string): void {
  try {
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      files.push(absolutePath);
    }
  } catch {
    // Intentionally swallow: if we can't verify the file (permissions, race), skip it.
  }
}

function resolveSingleFileHistory(options: {
  projectRoot: string;
  source: PlatformLogsKit_SourceConfig;
}): string[] {
  const history = options.source.singleFileHistory;
  if (history === undefined) {
    return [];
  }
  const resolved = logTail_resolveLatestLogFile({
    directory: path.join(options.projectRoot, history.directory),
    basenamePattern: history.basenamePattern,
    latestSymlinkPath: path.join(
      options.projectRoot,
      history.latestSymlinkPath,
    ),
  });
  return resolved !== undefined ? [resolved] : [];
}

function resolveRunFile(options: {
  plan: Extract<LogTailUiPlan, { kind: "view" }>;
  projectRoot: string;
  source: PlatformLogsKit_SourceConfig;
}): string | undefined {
  const history = options.source.scopedRunHistory;
  if (history === undefined) {
    return undefined;
  }
  const runIndex = Number.parseInt(options.plan.runIndex, 10);
  if (!Number.isFinite(runIndex) || runIndex < 1) {
    return undefined;
  }
  const directory = path.join(options.projectRoot, history.runDirectory);
  if (runIndex === 1) {
    return logTail_resolveLatestLogFile({
      directory,
      basenamePattern: history.runBasenamePattern,
      latestSymlinkPath: path.join(
        options.projectRoot,
        history.runLatestSymlinkPath,
      ),
    });
  }
  return logTail_resolveNthNewestMatchingFile({
    directory,
    basenamePattern: history.runBasenamePattern,
    indexOneBased: runIndex,
  });
}

function resolveScopedRunFiles(options: {
  config: PlatformLogsKit_Config;
  plan: Extract<LogTailUiPlan, { kind: "view" }>;
  projectRoot: string;
  source: PlatformLogsKit_SourceConfig;
}): string[] {
  const files: string[] = [];
  const scope = platformLogsKitFindScope(options.source, options.plan.scope);
  if (scope === undefined) {
    return files;
  }

  if (scope.includeRunIndex) {
    const runFile = resolveRunFile(options);
    if (runFile !== undefined) {
      appendIfFile(files, runFile);
    }
  }

  for (const relativePath of scope.filePaths) {
    appendIfFile(files, path.join(options.projectRoot, relativePath));
  }

  return files;
}

/** Resolves log file paths for a view plan. */
export function logTailUiResolveHistoryFiles(
  config: PlatformLogsKit_Config,
  projectRoot: string,
  plan: Extract<LogTailUiPlan, { kind: "view" }>,
): string[] {
  const source = platformLogsKitFindSource(config, plan.source);
  if (source === undefined) {
    return [];
  }
  if (source.kind === "single-file") {
    return resolveSingleFileHistory({ projectRoot, source });
  }
  return resolveScopedRunFiles({ config, plan, projectRoot, source });
}

/** Human-readable source description for previews and diagnostics rows. */
export function logTailUiDescribeSource(
  config: PlatformLogsKit_Config,
  plan: Extract<LogTailUiPlan, { kind: "view" }>,
): string {
  const source = platformLogsKitFindSource(config, plan.source);
  if (source === undefined) {
    return plan.source;
  }
  const scope = platformLogsKitFindScope(source, plan.scope);
  if (source.kind === "single-file") {
    return source.description;
  }
  if (scope !== undefined && plan.runIndex === "1" && scope.includeRunIndex) {
    return `${source.description} (${scope.label})`;
  }
  return scope !== undefined
    ? `${source.description} scope=${scope.id} run-index=${plan.runIndex}`
    : source.description;
}

/** Short label for a configured log source used in compact UI copy. */
export function logTailUiSourceLabel(
  config: PlatformLogsKit_Config,
  sourceId: LogTailUiSource,
): string {
  return platformLogsKitFindSource(config, sourceId)?.compactLabel ?? sourceId;
}
