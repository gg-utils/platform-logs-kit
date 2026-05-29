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
const ERRORISH = /\b(ERROR|FATAL|PANIC|Exception|Unhandled)\b/i;
/** Returns true when a line matches error-like tokens. */
export function logTailUiLineLooksLikeError(line) {
    return ERRORISH.test(line);
}
/** Attempts to parse a log line as JSON. */
export function logTailUiTryParseJsonLine(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || (trimmed[0] !== "{" && trimmed[0] !== "[")) {
        return { ok: false };
    }
    try {
        const value = JSON.parse(trimmed);
        return { ok: true, value };
    }
    catch {
        return { ok: false };
    }
}
/** Returns true if a log line passes inspection filters. */
export function logTailUiLineMatchesInspection(line, inspection) {
    if (inspection.errorsOnly && !logTailUiLineLooksLikeError(line)) {
        return false;
    }
    const substring = inspection.substring.trim();
    if (substring.length > 0 &&
        !line.toLowerCase().includes(substring.toLowerCase())) {
        return false;
    }
    if (inspection.jsonLines) {
        const parsed = logTailUiTryParseJsonLine(line);
        if (!parsed.ok) {
            return false;
        }
    }
    return true;
}
/** Applies inspection filters to each line. */
export function logTailUiFilterLines(lines, inspection) {
    return lines.filter((line) => logTailUiLineMatchesInspection(line, inspection));
}
/** Counts how many lines look like errors. */
export function logTailUiCountErrors(lines) {
    return lines.reduce((count, line) => count + (logTailUiLineLooksLikeError(line) ? 1 : 0), 0);
}
//# sourceMappingURL=inspect.js.map