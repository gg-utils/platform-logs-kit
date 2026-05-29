/**
 * @fileoverview Formats configured log-tail commands, npm shortcuts, and forwarded-arg previews.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/preview-plain.ts - Preview composer that uses these helpers.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
/** Returns a matching root `npm run <script>` line when the plan matches a published shortcut. */
export declare function logTailUiFormatNpmRunShortcut(config: PlatformLogsKit_Config, plan: LogTailUiPlan): string | null;
/** Formats `npm run <script>` with forwarded argv appended after `--`. */
export declare function logTailUiFormatNpmRunWithForwardedArgs(npmScript: string, forwardedArgv: readonly string[]): string;
/** Formats a `npx tsx <scriptRelative> [argv]` command string. */
export declare function logTailUiFormatTsxCommand(scriptRelative: string, argv: readonly string[]): string;
//# sourceMappingURL=format-command.d.ts.map