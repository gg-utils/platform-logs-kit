/**
 * @fileoverview Resolves the repository root path for log-tail entrypoints and launch helpers.
 *
 * This file owns `logTailUiResolveRepoRootFromModuleUrl`, turning a caller module URL plus a
 * relative climb into an absolute workspace root for kit UI spawn paths.
 * Flow: module URL -> dirname -> resolve(relativePathFromModuleDir) -> absolute repo root.
 *
 * @testing Node test runner (tsx --test): npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/index.ts - Kit barrel that re-exports this resolver and documents the canonical `@gg-utils/platform-logs-kit` import path for log UI consumers.
 * @see packages/platform-logs-kit/src/ui-launcher.ts - Spawn helpers that join `scriptPathUnderRepo` against the `repoRoot` string callers typically compute with this helper before launching `npx tsx`.
 * @see scripts/checks/platform-logs-package-boundary.ts - Boundary guard that retires duplicate `scripts/log-tail/ui/lib/repo-root.ts` shims so orchestration stays on this package-owned surface.
 *
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Resolves a repo root from a module URL plus a caller-supplied relative path. */
export declare function logTailUiResolveRepoRootFromModuleUrl(options: {
    moduleUrl: string;
    relativePathFromModuleDir: string;
}): string;
//# sourceMappingURL=repo-root.d.ts.map