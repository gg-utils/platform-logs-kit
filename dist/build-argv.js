/**
 * @fileoverview Builds canonical argv arrays and command tuples for configured log-tail plans.
 *
 * Flow: selected plan + project config -> canonical script -> argv -> preview/execution helpers.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/preview-plain.ts - Preview composer that uses this builder.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { platformLogsKitFindSource } from "./types.js";
import { logTailUiAssertValidViewPlan } from "./validate-plan.js";
function buildSelectorArgv(plan) {
    if (plan.selectorKind === "lines") {
        return ["--lines", plan.selectorValue];
    }
    if (plan.selectorKind === "chars") {
        return ["--chars", plan.selectorValue];
    }
    return [
        "--tokens",
        plan.selectorValue,
        "--chars-per-token",
        plan.charsPerToken,
    ];
}
/** Builds argv for a single-file source command that accepts selector flags directly. */
export function logTailUiBuildSingleFileSourceArgv(config, plan) {
    logTailUiAssertValidViewPlan(config, plan);
    const argv = buildSelectorArgv(plan);
    if (plan.mode === "history") {
        argv.push("--recent-only");
    }
    if (plan.mode === "tail" && plan.timeoutSeconds !== "") {
        argv.push("--timeout-seconds", plan.timeoutSeconds);
    }
    return argv;
}
/** Builds argv for a scoped run-log source command with `tail`/`history` subcommands. */
export function logTailUiBuildScopedRunSourceArgv(config, plan, source) {
    logTailUiAssertValidViewPlan(config, plan);
    const scope = source.scopes.find((candidate) => candidate.id === plan.scope);
    if (scope === undefined) {
        throw new Error(`Unknown log scope '${plan.scope}' for source '${source.id}'.`);
    }
    const argv = [
        plan.mode === "history" ? "history" : "tail",
        "--scope",
        plan.scope,
    ];
    if (scope.includeRunIndex) {
        argv.push("--run-index", plan.runIndex);
    }
    argv.push(...buildSelectorArgv(plan));
    if (plan.mode === "tail" && plan.timeoutSeconds !== "") {
        argv.push("--timeout-seconds", plan.timeoutSeconds);
    }
    return argv;
}
/** Builds the canonical argv and repo-relative script path for a log-tail plan. */
export function logTailUiBuildCanonicalArgv(config, plan) {
    if (plan.kind === "list-runs") {
        return {
            scriptRelative: config.listRuns.scriptRelative,
            argv: [...config.listRuns.argv],
        };
    }
    const source = platformLogsKitFindSource(config, plan.source);
    if (source === undefined) {
        throw new Error(`Unknown log source: ${plan.source}.`);
    }
    if (source.kind === "single-file") {
        return {
            scriptRelative: source.scriptRelative,
            argv: logTailUiBuildSingleFileSourceArgv(config, plan),
        };
    }
    return {
        scriptRelative: source.scriptRelative,
        argv: logTailUiBuildScopedRunSourceArgv(config, plan, source),
    };
}
//# sourceMappingURL=build-argv.js.map