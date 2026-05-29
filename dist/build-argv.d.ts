/**
 * @fileoverview Builds canonical argv arrays and command tuples for configured log-tail plans.
 *
 * Flow: selected plan + project config -> canonical script -> argv -> preview/execution helpers.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/preview-plain.ts - Preview composer that uses this builder.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan, PlatformLogsKit_CanonicalArgv, PlatformLogsKit_Config, PlatformLogsKit_SourceConfig } from "./types.js";
/** Builds argv for a single-file source command that accepts selector flags directly. */
export declare function logTailUiBuildSingleFileSourceArgv(config: PlatformLogsKit_Config, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>): string[];
/** Builds argv for a scoped run-log source command with `tail`/`history` subcommands. */
export declare function logTailUiBuildScopedRunSourceArgv(config: PlatformLogsKit_Config, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>, source: PlatformLogsKit_SourceConfig): string[];
/** Builds the canonical argv and repo-relative script path for a log-tail plan. */
export declare function logTailUiBuildCanonicalArgv(config: PlatformLogsKit_Config, plan: LogTailUiPlan): PlatformLogsKit_CanonicalArgv;
//# sourceMappingURL=build-argv.d.ts.map