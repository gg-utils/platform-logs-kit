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
/** Returns a cloned default view plan from project config. */
export function logTailUiDefaultViewPlan(config) {
    return {
        ...config.defaultViewPlan,
        inspection: { ...config.defaultViewPlan.inspection },
    };
}
/** Returns a configured source or undefined. */
export function platformLogsKitFindSource(config, sourceId) {
    return config.sources.find((source) => source.id === sourceId);
}
/** Returns a configured scope for a source or undefined. */
export function platformLogsKitFindScope(source, scopeId) {
    return source.scopes.find((scope) => scope.id === scopeId);
}
//# sourceMappingURL=types.js.map