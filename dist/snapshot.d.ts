/**
 * @fileoverview Reads recent log content from resolved files to power log-tail history UIs.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/resolve-log-targets.ts - Resolver that supplies files.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiPlan } from "./types.js";
/** Reads recent content from log files using `tail(1)` (non-follow). */
export declare function logTailUiSnapshotViewFiles(options: {
    filePaths: readonly string[];
    plan: Extract<LogTailUiPlan, {
        kind: "view";
    }>;
}): {
    lines: string[];
    truncated: boolean;
};
//# sourceMappingURL=snapshot.d.ts.map