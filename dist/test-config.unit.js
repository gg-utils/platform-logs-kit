/**
 * @fileoverview Owns the shared canned `PlatformLogsKit_Config` fixture that platform-logs-kit Jest
 * suites import when exercising argv builders, preview text, and wizard menus without touching
 * real log artifacts.
 *
 * This file keeps one stable config object aligned with the package contract so multiple unit
 * tests assert consistent source ids, scopes, shortcuts, and default view-plan defaults.
 * Flow: import `platformLogsKitTestConfig` -> pass into UI helpers -> assert formatted argv or
 * preview output.
 *
 * @testing Jest unit: npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/types.ts - Declares `PlatformLogsKit_Config`, the compile-time contract every field in this canned fixture must satisfy.
 * @see packages/platform-logs-kit/src/build-argv.unit.test.ts - Imports this fixture to regression-test argv construction against the stable runtime and dev source definitions encoded here.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/**
 * Canned platform logs kit configuration shared across unit tests.
 *
 * @remarks
 * Test-only fixture: update alongside `PlatformLogsKit_Config` when new required config keys land
 * so dependent Jest suites keep compiling.
 */
export const platformLogsKitTestConfig = {
    defaultLines: "1000",
    defaultChars: "20000",
    defaultTokens: "5000",
    defaultCharsPerToken: "4",
    defaultViewPlan: {
        kind: "view",
        source: "runtime",
        scope: "run",
        runIndex: "1",
        mode: "tail",
        selectorKind: "lines",
        selectorValue: "1000",
        charsPerToken: "4",
        timeoutSeconds: "",
        inspection: { errorsOnly: false, substring: "", jsonLines: false },
    },
    listRuns: {
        npmCommand: "npm run logs:list:runs",
        scriptRelative: "scripts/runtime/logs.ts",
        argv: ["list-runs"],
        title: "Log tail UI — list runtime runs",
    },
    sources: [
        {
            id: "runtime",
            compactLabel: "Runtime",
            description: "runtime logs",
            kind: "scoped-run-files",
            label: "Runtime logs",
            scriptRelative: "scripts/runtime/logs.ts",
            scopedRunHistory: {
                runDirectory: "logs/runtime/runs",
                runBasenamePattern: "runtime-*.log",
                runLatestSymlinkPath: "logs/runtime/runs/latest.log",
            },
            scopes: [
                {
                    id: "run",
                    description: "Latest / run-index logs",
                    label: "run scope",
                    includeRunIndex: true,
                    filePaths: [],
                },
                {
                    id: "all",
                    description: "Run plus sidecars",
                    label: "all scope",
                    includeRunIndex: true,
                    filePaths: ["logs/runtime/worker.log"],
                },
                {
                    id: "worker",
                    description: "Worker logs",
                    label: "worker scope",
                    includeRunIndex: false,
                    filePaths: ["logs/runtime/worker.log"],
                },
            ],
        },
        {
            id: "dev",
            compactLabel: "Dev",
            description: "dev logs",
            kind: "single-file",
            label: "Dev logs",
            scriptRelative: "scripts/dev-tail.ts",
            singleFileHistory: {
                directory: "logs/dev",
                basenamePattern: "dev-*.log",
                latestSymlinkPath: "logs/dev/latest.log",
            },
            scopes: [
                {
                    id: "default",
                    description: "Default dev log",
                    label: "default",
                    includeRunIndex: false,
                    filePaths: [],
                },
            ],
        },
    ],
    shortcuts: [
        {
            source: "runtime",
            scope: "run",
            mode: "tail",
            selectorKind: "lines",
            selectorValue: "1000",
            charsPerToken: "4",
            npmCommand: "npm run logs",
        },
        {
            source: "runtime",
            scope: "run",
            mode: "history",
            selectorKind: "lines",
            selectorValue: "1000",
            charsPerToken: "4",
            npmCommand: "npm run logs:recent",
        },
        {
            source: "runtime",
            scope: "all",
            mode: "tail",
            selectorKind: "lines",
            selectorValue: "1000",
            charsPerToken: "4",
            npmCommand: "npm run logs:tail:all",
        },
    ],
};
//# sourceMappingURL=test-config.unit.js.map