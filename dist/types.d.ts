/**
 * @fileoverview Config-driven log-tail plan and source types for platform log UI surfaces.
 *
 * Flow: project config -> default plan -> user adjustments -> argv builders, preview text,
 * validation helpers, and history resolvers.
 *
 * @example
 * ```typescript
 * const plan = logTailUiDefaultViewPlan(config);
 * ```
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/build-argv.ts - Command builder that consumes these shapes.
 * @see packages/platform-logs-kit/src/validate-plan.ts - Validation helpers for plan invariants.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Log source id supplied by project config. */
export type LogTailUiSource = string;
/** Source-specific scope id supplied by project config. */
export type LogTailUiScope = string;
/** Tail mode: `tail` streams new lines; `history` loads an existing log snapshot. */
export type LogTailUiMode = "tail" | "history";
/** Selector unit for the `--lines`, `--chars`, or `--tokens` flag. */
export type LogTailUiSelectorKind = "lines" | "chars" | "tokens";
/** Inspection flags applied to each log line in snapshot/live UI filters. */
export type LogTailUiInspection = {
    errorsOnly: boolean;
    substring: string;
    jsonLines: boolean;
};
/** Discriminated union. `list-runs` delegates to a configured command; `view` tails/history. */
export type LogTailUiPlan = {
    kind: "list-runs";
} | {
    kind: "view";
    source: LogTailUiSource;
    scope: LogTailUiScope;
    runIndex: string;
    mode: LogTailUiMode;
    selectorKind: LogTailUiSelectorKind;
    selectorValue: string;
    charsPerToken: string;
    timeoutSeconds: string;
    inspection: LogTailUiInspection;
};
/** Configured source kind that determines generic argv/history resolution. */
export type PlatformLogsKit_SourceKind = "single-file" | "scoped-run-files";
/** One configured source scope. */
export type PlatformLogsKit_ScopeConfig = {
    id: string;
    description: string;
    label: string;
    includeRunIndex: boolean;
    /** Relative file paths included when this scope is selected. */
    filePaths: readonly string[];
};
/** History discovery for a single-file source. */
export type PlatformLogsKit_SingleFileHistoryConfig = {
    directory: string;
    basenamePattern: string;
    latestSymlinkPath: string;
};
/** Run-log discovery for a scoped source with optional non-run sidecar files. */
export type PlatformLogsKit_ScopedRunHistoryConfig = {
    runDirectory: string;
    runBasenamePattern: string;
    runLatestSymlinkPath: string;
};
/** Root npm shortcuts for a configured source/scope/selector combination. */
export type PlatformLogsKit_ShortcutConfig = {
    charsPerToken: string;
    mode: LogTailUiMode;
    scope: string;
    selectorKind: LogTailUiSelectorKind;
    selectorValue: string;
    source: string;
    npmCommand: string;
};
/** Configured log source consumed by package helpers. */
export type PlatformLogsKit_SourceConfig = {
    id: string;
    compactLabel: string;
    description: string;
    kind: PlatformLogsKit_SourceKind;
    label: string;
    scriptRelative: string;
    scopes: readonly PlatformLogsKit_ScopeConfig[];
    singleFileHistory?: PlatformLogsKit_SingleFileHistoryConfig;
    scopedRunHistory?: PlatformLogsKit_ScopedRunHistoryConfig;
};
/** Project-owned config consumed by the reusable platform-logs kit. */
export type PlatformLogsKit_Config = {
    defaultViewPlan: Extract<LogTailUiPlan, {
        kind: "view";
    }>;
    defaultCharsPerToken: string;
    defaultLines: string;
    defaultChars: string;
    defaultTokens: string;
    listRuns: {
        npmCommand: string;
        scriptRelative: string;
        argv: readonly string[];
        title: string;
    };
    sources: readonly PlatformLogsKit_SourceConfig[];
    shortcuts: readonly PlatformLogsKit_ShortcutConfig[];
};
/** Canonical argv and repo-relative script path for a log-tail plan. */
export type PlatformLogsKit_CanonicalArgv = {
    scriptRelative: string;
    argv: string[];
};
/** Returns a cloned default view plan from project config. */
export declare function logTailUiDefaultViewPlan(config: PlatformLogsKit_Config): Extract<LogTailUiPlan, {
    kind: "view";
}>;
/** Returns a configured source or undefined. */
export declare function platformLogsKitFindSource(config: PlatformLogsKit_Config, sourceId: string): PlatformLogsKit_SourceConfig | undefined;
/** Returns a configured scope for a source or undefined. */
export declare function platformLogsKitFindScope(source: PlatformLogsKit_SourceConfig, scopeId: string): PlatformLogsKit_ScopeConfig | undefined;
//# sourceMappingURL=types.d.ts.map