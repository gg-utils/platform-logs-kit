/**
 * @fileoverview Plain-text log-tail preview formatter for configured Ink/OpenTUI entrypoints.
 *
 * Flow: plan + config -> canonical argv/shortcut text -> operator preview copy.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/build-argv.ts - Canonical argv builder used here.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
/** Builds a multi-line preview describing how a plan maps to npm shortcuts and direct `tsx`. */
export declare function logTailUiBuildPreviewPlainText(config: PlatformLogsKit_Config, plan: LogTailUiPlan): string;
/** One-line status label for list views and compact Ink/OpenTUI status rows. */
export declare function logTailUiBuildSummaryLine(config: PlatformLogsKit_Config, plan: LogTailUiPlan): string;
//# sourceMappingURL=preview-plain.d.ts.map