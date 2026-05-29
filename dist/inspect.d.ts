/**
 * @fileoverview Classifies and filters log-tail output lines for history snapshots and previews.
 *
 * This file owns pure string helpers that interpret each line against a `LogTailUiInspection`
 * snapshot: error-ish token detection, optional JSON-only acceptance, case-insensitive substring
 * matching, and list-level filtering plus error counting for UI summaries.
 *
 * @example
 * ```typescript
 * import { logTailUiFilterLines } from "@gg-utils/platform-logs-kit/inspect";
 *
 * logTailUiFilterLines(["[APP] ERROR: boom", "listening on 3000"], {
 *   errorsOnly: true,
 *   substring: "",
 *   jsonLines: false,
 * });
 * ```
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/types.ts - Declares `LogTailUiInspection`, the filter flags (errors-only, substring, JSON lines) that `logTailUiLineMatchesInspection` enforces per line.
 * @see packages/platform-logs-kit/src/inspect.unit.test.ts - Node test runner (`tsx --test`) coverage for error detection, inspection matching, filtering, and error counting owned by this module.
 * @see packages/platform-logs-kit/src/ink-app.tsx - Ink log UI imports `logTailUiFilterLines` so history and live tail panes honor the same inspection contract as OpenTUI.
 * @see packages/platform-logs-kit/src/opentui-app.tsx - OpenTUI log UI reuses `logTailUiFilterLines`, keeping filtered tail output aligned with the Ink implementation.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { LogTailUiInspection } from "./types.js";
/** Returns true when a line matches error-like tokens. */
export declare function logTailUiLineLooksLikeError(line: string): boolean;
/** Attempts to parse a log line as JSON. */
export declare function logTailUiTryParseJsonLine(line: string): {
    ok: true;
    value: unknown;
} | {
    ok: false;
};
/** Returns true if a log line passes inspection filters. */
export declare function logTailUiLineMatchesInspection(line: string, inspection: LogTailUiInspection): boolean;
/** Applies inspection filters to each line. */
export declare function logTailUiFilterLines(lines: readonly string[], inspection: LogTailUiInspection): string[];
/** Counts how many lines look like errors. */
export declare function logTailUiCountErrors(lines: readonly string[]): number;
//# sourceMappingURL=inspect.d.ts.map