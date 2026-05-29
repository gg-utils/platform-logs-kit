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
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
/** Screen ids shared by terminal launchers before each renderer maps them to its own primitives. */
export type LogTailUiWizardScreen = "menu" | "scope" | "mode" | "budget" | "inspect" | "preview" | "live" | "history" | "list";
/** Ink MemoryRouter route path for a wizard screen. */
export type LogTailUiWizardRoute = "/" | "/scope" | "/mode" | "/budget" | "/inspect" | "/preview" | "/run-list" | "/run-tail" | "/run-history";
/** Generic terminal select row used by Ink numbered menus and OpenTUI tab-selects. */
export type LogTailUiWizardSelectOption = {
    description: string;
    name: string;
    value: string;
};
/** Project-configured main-menu row. */
export type PlatformLogsKit_WizardEntryOption = {
    description: string;
    includeInInkMenu: boolean;
    kind: "view";
    name: string;
    nextScreen: "scope" | "mode";
    scope?: string;
    source: string;
    value: string;
} | {
    description: string;
    includeInInkMenu: boolean;
    kind: "list-runs";
    name: string;
    nextScreen: "preview";
    value: string;
} | {
    description: string;
    includeInInkMenu: boolean;
    kind: "exit";
    name: string;
    value: string;
};
/** Root-owned wizard config injected into package helpers. */
export type PlatformLogsKit_WizardConfig = {
    /** Source whose mode-back behavior returns to the scope picker instead of the main menu. */
    scopedSourceId: string;
    /** Ordered terminal menu rows. */
    entryOptions: readonly PlatformLogsKit_WizardEntryOption[];
};
/** Result returned when a selectable UI value is interpreted by the wizard model. */
export type LogTailUiWizardSelectionResult = {
    action: "none";
} | {
    action: "exit";
} | {
    action: "navigate";
    nextRoute: LogTailUiWizardRoute;
    nextScreen: LogTailUiWizardScreen;
    plan: LogTailUiPlan;
};
/** Converts a shared screen id into the Ink route used by the root launcher. */
export declare function logTailUiWizardRouteForScreen(screen: LogTailUiWizardScreen): LogTailUiWizardRoute;
/** Returns configured entry rows, optionally hiding rows that the Ink numbered menu omits. */
export declare function logTailUiWizardEntryOptions(wizardConfig: PlatformLogsKit_WizardConfig, options: {
    includeInkHiddenOptions: boolean;
}): LogTailUiWizardSelectOption[];
/** Resolves a main-menu value into a new plan plus next screen, or an exit/no-op signal. */
export declare function logTailUiWizardResolveEntrySelection(config: PlatformLogsKit_Config, wizardConfig: PlatformLogsKit_WizardConfig, value: string | undefined): LogTailUiWizardSelectionResult;
/** Builds scope picker rows for the configured scoped source. */
export declare function logTailUiWizardScopeOptions(config: PlatformLogsKit_Config, wizardConfig: PlatformLogsKit_WizardConfig, options: {
    includeBackOption: boolean;
}): LogTailUiWizardSelectOption[];
/** Applies a scope picker selection to a view plan. */
export declare function logTailUiWizardResolveScopeSelection(plan: LogTailUiPlan, value: string | undefined): LogTailUiWizardSelectionResult;
/** Builds follow/history mode options. */
export declare function logTailUiWizardModeOptions(options: {
    includeBackOption: boolean;
}): LogTailUiWizardSelectOption[];
/** Returns the screen used by mode-back navigation for the current plan. */
export declare function logTailUiWizardModeBackScreen(wizardConfig: PlatformLogsKit_WizardConfig, plan: LogTailUiPlan): LogTailUiWizardScreen;
/** Applies a mode picker value to a view plan. */
export declare function logTailUiWizardResolveModeSelection(wizardConfig: PlatformLogsKit_WizardConfig, plan: LogTailUiPlan, value: string | undefined): LogTailUiWizardSelectionResult;
/** Builds budget presets from the configured defaults. */
export declare function logTailUiWizardBudgetOptions(config: PlatformLogsKit_Config, options: {
    includeBackOption: boolean;
}): LogTailUiWizardSelectOption[];
/** Applies a budget preset to a view plan. */
export declare function logTailUiWizardResolveBudgetSelection(config: PlatformLogsKit_Config, plan: LogTailUiPlan, value: string | undefined): LogTailUiWizardSelectionResult;
/** Builds inspection filter action rows. */
export declare function logTailUiWizardInspectOptions(options: {
    includeBackOption: boolean;
}): LogTailUiWizardSelectOption[];
/** Applies an inspection action to a view plan. */
export declare function logTailUiWizardResolveInspectSelection(plan: LogTailUiPlan, value: string | undefined): LogTailUiWizardSelectionResult;
/** Builds preview action rows. */
export declare function logTailUiWizardPreviewOptions(): LogTailUiWizardSelectOption[];
/** Applies a preview action after validation has already produced any current errors. */
export declare function logTailUiWizardResolvePreviewSelection(plan: LogTailUiPlan, value: string | undefined, validationErrors: readonly string[]): LogTailUiWizardSelectionResult;
/** Appends one line to a rolling display buffer. */
export declare function logTailUiWizardAppendBoundedLine(lines: readonly string[], line: string, maxLines: number): string[];
/** Appends text to a rolling character buffer. */
export declare function logTailUiWizardAppendBoundedText(previous: string, chunk: string, maxCharacters: number): string;
/** Splits a text buffer into the last non-empty lines for scrollable terminal display. */
export declare function logTailUiWizardSplitBufferedText(text: string, maxLines: number): string[];
//# sourceMappingURL=wizard-model.d.ts.map