/**
 * @fileoverview Resolves configured log files that log-tail UIs inspect for view plans.
 *
 * Flow: project config + plan -> scope/run-index -> resolved log files -> snapshot surfaces.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/snapshot.ts - Snapshot reader that consumes file lists.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan, LogTailUiSource, PlatformLogsKit_Config } from "./types.js";
/** Resolves log file paths for a view plan. */
export declare function logTailUiResolveHistoryFiles(config: PlatformLogsKit_Config, projectRoot: string, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>): string[];
/** Human-readable source description for previews and diagnostics rows. */
export declare function logTailUiDescribeSource(config: PlatformLogsKit_Config, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>): string;
/** Short label for a configured log source used in compact UI copy. */
export declare function logTailUiSourceLabel(config: PlatformLogsKit_Config, sourceId: LogTailUiSource): string;
//# sourceMappingURL=resolve-log-targets.d.ts.map