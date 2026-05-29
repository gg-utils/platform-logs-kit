/**
 * @fileoverview Validates configured log-tail view plans before argv, previews, or sessions run.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/types.ts - Plan/config shapes whose invariants are enforced.
 * @see packages/platform-logs-kit/src/build-argv.ts - Builder that calls this validator.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
/** Collects validation errors for a view plan without throwing. */
export declare function logTailUiValidateViewPlan(config: PlatformLogsKit_Config, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>): string[];
/** Throws when `logTailUiValidateViewPlan` finds blocking issues. */
export declare function logTailUiAssertValidViewPlan(config: PlatformLogsKit_Config, plan: Extract<LogTailUiPlan, {
    kind: "view";
}>): void;
//# sourceMappingURL=validate-plan.d.ts.map