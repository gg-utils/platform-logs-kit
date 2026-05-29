/**
 * @fileoverview Shared fast-exit decision logic for config-driven log UI entrypoints.
 *
 * Flow: raw launcher argv + injected help text + log config -> parse error, help, preview, or
 * interactive render action. Root scripts keep process exits and surface-specific render bootstraps.
 *
 * @testing Node test runner (tsx): npm run platform-logs-kit:test from the repository root runs the package `tsx --test` harness over `packages/platform-logs-kit/src/*.unit.test.ts`, including `ui-entrypoint.unit.test.ts`, after changes here.
 *
 * @see packages/platform-logs-kit/src/ui-launcher.ts - Parses argv and resolves `projectRoot` before this module maps results into help, plain-text preview, render, or structured error actions.
 * @see packages/platform-logs-kit/src/preview-plain.ts - Builds the default-view plain-text preview payload returned when launch options request `--print-preview`.
 * @see scripts/log-tail/ui/cli-ink/index.ts - Root Ink launcher imports `PlatformLogsKit_resolveUiEntrypointAction`, applies exit/help/preview fast paths, and only bootstraps Ink rendering on the `render` branch.
 * @see packages/platform-logs-kit/src/ui-entrypoint.unit.test.ts - Node `tsx --test` suite that locks help, preview, render, and parser-failure mappings for the resolver owned here.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { PlatformLogsKit_Config } from "./types.js";
/** Action a root launcher should perform after package-owned argv/preview resolution. */
export type PlatformLogsKit_UiEntrypointAction = {
    exitCode: 1;
    kind: "error";
    message: string;
} | {
    exitCode: 0;
    kind: "help";
    text: string;
} | {
    exitCode: 0;
    kind: "preview";
    text: string;
} | {
    kind: "render";
    projectRoot: string;
};
/** Resolves launcher fast-exit actions while leaving process/render side effects to root adapters. */
export declare function PlatformLogsKit_resolveUiEntrypointAction(options: {
    argv: readonly string[];
    config: PlatformLogsKit_Config;
    cwd: string;
    errorPrefix: string;
    helpText: string;
}): PlatformLogsKit_UiEntrypointAction;
//# sourceMappingURL=ui-entrypoint.d.ts.map