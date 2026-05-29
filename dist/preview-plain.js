/**
 * @fileoverview Plain-text log-tail preview formatter for configured Ink/OpenTUI entrypoints.
 *
 * Flow: plan + config -> canonical argv/shortcut text -> operator preview copy.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/build-argv.ts - Canonical argv builder used here.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { logTailUiBuildCanonicalArgv } from "./build-argv.js";
import { logTailUiDescribeSource, logTailUiSourceLabel, } from "./resolve-log-targets.js";
import { logTailUiFormatNpmRunShortcut, logTailUiFormatTsxCommand, } from "./format-command.js";
function selectorDescription(plan) {
    if (plan.selectorKind === "lines") {
        return `${plan.selectorValue} lines`;
    }
    if (plan.selectorKind === "chars") {
        return `${plan.selectorValue} chars`;
    }
    return `${plan.selectorValue} tokens (chars/token=${plan.charsPerToken})`;
}
/** Builds a multi-line preview describing how a plan maps to npm shortcuts and direct `tsx`. */
export function logTailUiBuildPreviewPlainText(config, plan) {
    if (plan.kind === "list-runs") {
        const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, plan);
        const tsx = logTailUiFormatTsxCommand(scriptRelative, argv);
        const npm = logTailUiFormatNpmRunShortcut(config, plan);
        return [
            config.listRuns.title,
            "",
            "Canonical npm:",
            `  ${npm ?? "(no exact shortcut — use tsx below)"}`,
            "",
            "Direct:",
            `  ${tsx}`,
        ].join("\n");
    }
    const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, plan);
    const tsx = logTailUiFormatTsxCommand(scriptRelative, argv);
    const npmShortcut = logTailUiFormatNpmRunShortcut(config, plan);
    return [
        "Log tail UI — preview",
        `Source: ${logTailUiDescribeSource(config, plan)}`,
        `Mode: ${plan.mode === "tail" ? "follow (tail)" : "snapshot (history)"}`,
        `Selector: ${selectorDescription(plan)}`,
        plan.timeoutSeconds !== ""
            ? `Timeout: ${plan.timeoutSeconds}s`
            : "Timeout: (none)",
        `Inspection: errorsOnly=${String(plan.inspection.errorsOnly)} substring=${plan.inspection.substring || "(none)"} jsonLines=${String(plan.inspection.jsonLines)}`,
        "",
        "Canonical npm (when it matches defaults):",
        `  ${npmShortcut ?? "(no exact shortcut — use tsx below)"}`,
        "",
        "Direct (always equivalent):",
        `  ${tsx}`,
    ].join("\n");
}
/** One-line status label for list views and compact Ink/OpenTUI status rows. */
export function logTailUiBuildSummaryLine(config, plan) {
    if (plan.kind === "list-runs") {
        return config.listRuns.title;
    }
    return `${logTailUiSourceLabel(config, plan.source)} · ${plan.mode} · ${plan.selectorKind}=${plan.selectorValue}`;
}
//# sourceMappingURL=preview-plain.js.map