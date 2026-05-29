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
import { type ChildProcess } from "node:child_process";
/** Parsed launcher flags shared by the Ink and OpenTUI log-tail wrappers. */
export type PlatformLogsKit_UiLaunchOptions = {
    helpRequested: boolean;
    printPreviewRequested: boolean;
    projectRoot: string;
};
/** Parses shared log-tail UI launch flags from an argv slice. */
export declare function PlatformLogsKit_parseUiLaunchOptions(options: {
    argv: readonly string[];
    cwd: string;
    errorPrefix: string;
}): PlatformLogsKit_UiLaunchOptions;
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
export declare function PlatformLogsKit_formatUiHelpText(options: PlatformLogsKit_UiHelpTextOptions): string;
/** Optional stdout/stderr sinks for streamed `npx tsx` children. */
export type PlatformLogsKit_UiSpawnHandlers = {
    onStderrChunk?: (chunk: string) => void;
    onStdoutChunk?: (chunk: string) => void;
};
/** Stream `npx tsx <scriptUnderRepo>` from `repoRoot`; `cancel` terminates the child. */
export declare function PlatformLogsKit_spawnNpxTsxStream(options: {
    args: readonly string[];
    handlers?: PlatformLogsKit_UiSpawnHandlers;
    repoRoot: string;
    scriptPathUnderRepo: string;
}): {
    cancel: () => void;
    child: ChildProcess;
};
/** Runs `npx tsx` once, buffers stdout/stderr until exit, and returns the exit status. */
export declare function PlatformLogsKit_spawnNpxTsxOnce(options: {
    args: readonly string[];
    repoRoot: string;
    scriptPathUnderRepo: string;
}): Promise<{
    status: number;
    stderr: string;
    stdout: string;
}>;
//# sourceMappingURL=ui-launcher.d.ts.map