/**
 * @fileoverview Reusable wizard state and option models for platform log Ink/OpenTUI launchers.
 *
 * Flow: project wizard config + log config -> selectable rows -> plan mutations -> next screen/route.
 * Terminal renderers stay in root adapters, but their menu values, route decisions, budget presets,
 * inspection toggles, and bounded output buffers are package-owned here.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/types.ts - Log plan and source config consumed by this model.
 * @documentation reviewed=2026-05-21 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { logTailUiDefaultViewPlan, platformLogsKitFindSource, } from "./types.js";
/** Converts a shared screen id into the Ink route used by the root launcher. */
export function logTailUiWizardRouteForScreen(screen) {
    if (screen === "menu") {
        return "/";
    }
    if (screen === "scope") {
        return "/scope";
    }
    if (screen === "mode") {
        return "/mode";
    }
    if (screen === "budget") {
        return "/budget";
    }
    if (screen === "inspect") {
        return "/inspect";
    }
    if (screen === "preview") {
        return "/preview";
    }
    if (screen === "list") {
        return "/run-list";
    }
    if (screen === "live") {
        return "/run-tail";
    }
    return "/run-history";
}
function logTailUiWizardNavigate(plan, nextScreen) {
    return {
        action: "navigate",
        nextRoute: logTailUiWizardRouteForScreen(nextScreen),
        nextScreen,
        plan,
    };
}
function findWizardEntryOption(wizardConfig, value) {
    return wizardConfig.entryOptions.find((option) => option.value === value);
}
function getDefaultScopeForSource(config, sourceId) {
    const source = platformLogsKitFindSource(config, sourceId);
    const firstScope = source?.scopes[0]?.id;
    if (firstScope !== undefined) {
        return firstScope;
    }
    return logTailUiDefaultViewPlan(config).scope;
}
/** Returns configured entry rows, optionally hiding rows that the Ink numbered menu omits. */
export function logTailUiWizardEntryOptions(wizardConfig, options) {
    return wizardConfig.entryOptions
        .filter((option) => options.includeInkHiddenOptions || option.includeInInkMenu)
        .map((option) => ({
        description: option.description,
        name: option.name,
        value: option.value,
    }));
}
/** Resolves a main-menu value into a new plan plus next screen, or an exit/no-op signal. */
export function logTailUiWizardResolveEntrySelection(config, wizardConfig, value) {
    const option = findWizardEntryOption(wizardConfig, value);
    if (option === undefined) {
        return { action: "none" };
    }
    if (option.kind === "exit") {
        return { action: "exit" };
    }
    if (option.kind === "list-runs") {
        return logTailUiWizardNavigate({ kind: "list-runs" }, option.nextScreen);
    }
    return logTailUiWizardNavigate({
        ...logTailUiDefaultViewPlan(config),
        kind: "view",
        source: option.source,
        scope: option.scope ?? getDefaultScopeForSource(config, option.source),
    }, option.nextScreen);
}
/** Builds scope picker rows for the configured scoped source. */
export function logTailUiWizardScopeOptions(config, wizardConfig, options) {
    const source = platformLogsKitFindSource(config, wizardConfig.scopedSourceId);
    const sourceOptions = source?.scopes.map((scope) => ({
        description: scope.description,
        name: scope.label,
        value: scope.id,
    })) ?? [];
    if (!options.includeBackOption) {
        return sourceOptions;
    }
    return [
        ...sourceOptions,
        { description: "Return to the previous menu", name: "Back", value: "back" },
    ];
}
/** Applies a scope picker selection to a view plan. */
export function logTailUiWizardResolveScopeSelection(plan, value) {
    if (value === undefined) {
        return { action: "none" };
    }
    if (value === "back") {
        return logTailUiWizardNavigate(plan, "menu");
    }
    if (plan.kind !== "view") {
        return { action: "none" };
    }
    return logTailUiWizardNavigate({ ...plan, scope: value }, "mode");
}
/** Builds follow/history mode options. */
export function logTailUiWizardModeOptions(options) {
    const baseOptions = [
        { description: "Follow via canonical tail", name: "Follow", value: "tail" },
        { description: "Snapshot in UI", name: "History", value: "history" },
    ];
    if (!options.includeBackOption) {
        return baseOptions;
    }
    return [
        ...baseOptions,
        { description: "Return to the previous menu", name: "Back", value: "back" },
    ];
}
/** Returns the screen used by mode-back navigation for the current plan. */
export function logTailUiWizardModeBackScreen(wizardConfig, plan) {
    if (plan.kind === "view" && plan.source === wizardConfig.scopedSourceId) {
        return "scope";
    }
    return "menu";
}
/** Applies a mode picker value to a view plan. */
export function logTailUiWizardResolveModeSelection(wizardConfig, plan, value) {
    if (value === "back") {
        return logTailUiWizardNavigate(plan, logTailUiWizardModeBackScreen(wizardConfig, plan));
    }
    if (plan.kind !== "view" || (value !== "tail" && value !== "history")) {
        return { action: "none" };
    }
    return logTailUiWizardNavigate({ ...plan, mode: value }, "budget");
}
/** Builds budget presets from the configured defaults. */
export function logTailUiWizardBudgetOptions(config, options) {
    const baseOptions = [
        {
            description: `${config.defaultLines} lines`,
            name: `lines ${config.defaultLines}`,
            value: "lines",
        },
        {
            description: `${config.defaultChars} chars`,
            name: `chars ${config.defaultChars}`,
            value: "chars",
        },
        {
            description: `${config.defaultTokens} tokens @ ${config.defaultCharsPerToken} c/t`,
            name: `tokens ${config.defaultTokens}`,
            value: "tokens",
        },
    ];
    if (!options.includeBackOption) {
        return baseOptions;
    }
    return [
        ...baseOptions,
        { description: "Return to mode selection", name: "Back", value: "back" },
    ];
}
/** Applies a budget preset to a view plan. */
export function logTailUiWizardResolveBudgetSelection(config, plan, value) {
    if (value === "back") {
        return logTailUiWizardNavigate(plan, "mode");
    }
    if (plan.kind !== "view") {
        return { action: "none" };
    }
    if (value === "lines") {
        return logTailUiWizardNavigate({
            ...plan,
            selectorKind: "lines",
            selectorValue: config.defaultLines,
            charsPerToken: config.defaultCharsPerToken,
        }, "inspect");
    }
    if (value === "chars") {
        return logTailUiWizardNavigate({
            ...plan,
            selectorKind: "chars",
            selectorValue: config.defaultChars,
            charsPerToken: config.defaultCharsPerToken,
        }, "inspect");
    }
    if (value === "tokens") {
        return logTailUiWizardNavigate({
            ...plan,
            selectorKind: "tokens",
            selectorValue: config.defaultTokens,
            charsPerToken: config.defaultCharsPerToken,
        }, "inspect");
    }
    return { action: "none" };
}
/** Builds inspection filter action rows. */
export function logTailUiWizardInspectOptions(options) {
    const baseOptions = [
        {
            description: "Toggle errors-only filter",
            name: "Toggle errors",
            value: "errors",
        },
        {
            description: "Toggle JSON-lines filter",
            name: "Toggle JSON",
            value: "json",
        },
        { description: "Continue to preview", name: "Continue", value: "continue" },
    ];
    if (!options.includeBackOption) {
        return baseOptions;
    }
    return [
        ...baseOptions,
        { description: "Return to budget selection", name: "Back", value: "back" },
    ];
}
/** Applies an inspection action to a view plan. */
export function logTailUiWizardResolveInspectSelection(plan, value) {
    if (value === "back") {
        return logTailUiWizardNavigate(plan, "budget");
    }
    if (value === "continue") {
        return logTailUiWizardNavigate(plan, "preview");
    }
    if (plan.kind !== "view") {
        return { action: "none" };
    }
    if (value === "errors") {
        return logTailUiWizardNavigate({
            ...plan,
            inspection: {
                ...plan.inspection,
                errorsOnly: !plan.inspection.errorsOnly,
            },
        }, "inspect");
    }
    if (value === "json") {
        return logTailUiWizardNavigate({
            ...plan,
            inspection: {
                ...plan.inspection,
                jsonLines: !plan.inspection.jsonLines,
            },
        }, "inspect");
    }
    return { action: "none" };
}
/** Builds preview action rows. */
export function logTailUiWizardPreviewOptions() {
    return [
        { description: "Run canonical command", name: "Run", value: "run" },
        { description: "Return to the previous step", name: "Back", value: "back" },
    ];
}
/** Applies a preview action after validation has already produced any current errors. */
export function logTailUiWizardResolvePreviewSelection(plan, value, validationErrors) {
    if (value === "back") {
        return logTailUiWizardNavigate(plan, plan.kind === "list-runs" ? "menu" : "inspect");
    }
    if (value !== "run") {
        return { action: "none" };
    }
    if (plan.kind === "list-runs") {
        return logTailUiWizardNavigate(plan, "list");
    }
    if (validationErrors.length > 0) {
        return { action: "none" };
    }
    return logTailUiWizardNavigate(plan, plan.mode === "tail" ? "live" : "history");
}
/** Appends one line to a rolling display buffer. */
export function logTailUiWizardAppendBoundedLine(lines, line, maxLines) {
    return [...lines, line].slice(-maxLines);
}
/** Appends text to a rolling character buffer. */
export function logTailUiWizardAppendBoundedText(previous, chunk, maxCharacters) {
    return (previous + chunk).slice(-maxCharacters);
}
/** Splits a text buffer into the last non-empty lines for scrollable terminal display. */
export function logTailUiWizardSplitBufferedText(text, maxLines) {
    return text
        .split(/\r?\n/u)
        .filter((line) => line.length > 0)
        .slice(-maxLines);
}
//# sourceMappingURL=wizard-model.js.map