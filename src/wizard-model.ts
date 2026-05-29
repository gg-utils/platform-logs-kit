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
import {
  logTailUiDefaultViewPlan,
  platformLogsKitFindSource,
} from "./types.js";

/** Screen ids shared by terminal launchers before each renderer maps them to its own primitives. */
export type LogTailUiWizardScreen =
  | "menu"
  | "scope"
  | "mode"
  | "budget"
  | "inspect"
  | "preview"
  | "live"
  | "history"
  | "list";

/** Ink MemoryRouter route path for a wizard screen. */
export type LogTailUiWizardRoute =
  | "/"
  | "/scope"
  | "/mode"
  | "/budget"
  | "/inspect"
  | "/preview"
  | "/run-list"
  | "/run-tail"
  | "/run-history";

/** Generic terminal select row used by Ink numbered menus and OpenTUI tab-selects. */
export type LogTailUiWizardSelectOption = {
  description: string;
  name: string;
  value: string;
};

/** Project-configured main-menu row. */
export type PlatformLogsKit_WizardEntryOption =
  | {
      description: string;
      includeInInkMenu: boolean;
      kind: "view";
      name: string;
      nextScreen: "scope" | "mode";
      scope?: string;
      source: string;
      value: string;
    }
  | {
      description: string;
      includeInInkMenu: boolean;
      kind: "list-runs";
      name: string;
      nextScreen: "preview";
      value: string;
    }
  | {
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
export type LogTailUiWizardSelectionResult =
  | { action: "none" }
  | { action: "exit" }
  | {
      action: "navigate";
      nextRoute: LogTailUiWizardRoute;
      nextScreen: LogTailUiWizardScreen;
      plan: LogTailUiPlan;
    };

/** Converts a shared screen id into the Ink route used by the root launcher. */
export function logTailUiWizardRouteForScreen(
  screen: LogTailUiWizardScreen,
): LogTailUiWizardRoute {
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

function logTailUiWizardNavigate(
  plan: LogTailUiPlan,
  nextScreen: LogTailUiWizardScreen,
): LogTailUiWizardSelectionResult {
  return {
    action: "navigate",
    nextRoute: logTailUiWizardRouteForScreen(nextScreen),
    nextScreen,
    plan,
  };
}

function findWizardEntryOption(
  wizardConfig: PlatformLogsKit_WizardConfig,
  value: string | undefined,
): PlatformLogsKit_WizardEntryOption | undefined {
  return wizardConfig.entryOptions.find((option) => option.value === value);
}

function getDefaultScopeForSource(
  config: PlatformLogsKit_Config,
  sourceId: string,
): string {
  const source = platformLogsKitFindSource(config, sourceId);
  const firstScope = source?.scopes[0]?.id;
  if (firstScope !== undefined) {
    return firstScope;
  }
  return logTailUiDefaultViewPlan(config).scope;
}

/** Returns configured entry rows, optionally hiding rows that the Ink numbered menu omits. */
export function logTailUiWizardEntryOptions(
  wizardConfig: PlatformLogsKit_WizardConfig,
  options: { includeInkHiddenOptions: boolean },
): LogTailUiWizardSelectOption[] {
  return wizardConfig.entryOptions
    .filter(
      (option) => options.includeInkHiddenOptions || option.includeInInkMenu,
    )
    .map((option) => ({
      description: option.description,
      name: option.name,
      value: option.value,
    }));
}

/** Resolves a main-menu value into a new plan plus next screen, or an exit/no-op signal. */
export function logTailUiWizardResolveEntrySelection(
  config: PlatformLogsKit_Config,
  wizardConfig: PlatformLogsKit_WizardConfig,
  value: string | undefined,
): LogTailUiWizardSelectionResult {
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

  return logTailUiWizardNavigate(
    {
      ...logTailUiDefaultViewPlan(config),
      kind: "view",
      source: option.source,
      scope: option.scope ?? getDefaultScopeForSource(config, option.source),
    },
    option.nextScreen,
  );
}

/** Builds scope picker rows for the configured scoped source. */
export function logTailUiWizardScopeOptions(
  config: PlatformLogsKit_Config,
  wizardConfig: PlatformLogsKit_WizardConfig,
  options: { includeBackOption: boolean },
): LogTailUiWizardSelectOption[] {
  const source = platformLogsKitFindSource(config, wizardConfig.scopedSourceId);
  const sourceOptions =
    source?.scopes.map((scope) => ({
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
export function logTailUiWizardResolveScopeSelection(
  plan: LogTailUiPlan,
  value: string | undefined,
): LogTailUiWizardSelectionResult {
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
export function logTailUiWizardModeOptions(options: {
  includeBackOption: boolean;
}): LogTailUiWizardSelectOption[] {
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
export function logTailUiWizardModeBackScreen(
  wizardConfig: PlatformLogsKit_WizardConfig,
  plan: LogTailUiPlan,
): LogTailUiWizardScreen {
  if (plan.kind === "view" && plan.source === wizardConfig.scopedSourceId) {
    return "scope";
  }
  return "menu";
}

/** Applies a mode picker value to a view plan. */
export function logTailUiWizardResolveModeSelection(
  wizardConfig: PlatformLogsKit_WizardConfig,
  plan: LogTailUiPlan,
  value: string | undefined,
): LogTailUiWizardSelectionResult {
  if (value === "back") {
    return logTailUiWizardNavigate(
      plan,
      logTailUiWizardModeBackScreen(wizardConfig, plan),
    );
  }
  if (plan.kind !== "view" || (value !== "tail" && value !== "history")) {
    return { action: "none" };
  }
  return logTailUiWizardNavigate({ ...plan, mode: value }, "budget");
}

/** Builds budget presets from the configured defaults. */
export function logTailUiWizardBudgetOptions(
  config: PlatformLogsKit_Config,
  options: { includeBackOption: boolean },
): LogTailUiWizardSelectOption[] {
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
export function logTailUiWizardResolveBudgetSelection(
  config: PlatformLogsKit_Config,
  plan: LogTailUiPlan,
  value: string | undefined,
): LogTailUiWizardSelectionResult {
  if (value === "back") {
    return logTailUiWizardNavigate(plan, "mode");
  }
  if (plan.kind !== "view") {
    return { action: "none" };
  }
  if (value === "lines") {
    return logTailUiWizardNavigate(
      {
        ...plan,
        selectorKind: "lines",
        selectorValue: config.defaultLines,
        charsPerToken: config.defaultCharsPerToken,
      },
      "inspect",
    );
  }
  if (value === "chars") {
    return logTailUiWizardNavigate(
      {
        ...plan,
        selectorKind: "chars",
        selectorValue: config.defaultChars,
        charsPerToken: config.defaultCharsPerToken,
      },
      "inspect",
    );
  }
  if (value === "tokens") {
    return logTailUiWizardNavigate(
      {
        ...plan,
        selectorKind: "tokens",
        selectorValue: config.defaultTokens,
        charsPerToken: config.defaultCharsPerToken,
      },
      "inspect",
    );
  }
  return { action: "none" };
}

/** Builds inspection filter action rows. */
export function logTailUiWizardInspectOptions(options: {
  includeBackOption: boolean;
}): LogTailUiWizardSelectOption[] {
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
export function logTailUiWizardResolveInspectSelection(
  plan: LogTailUiPlan,
  value: string | undefined,
): LogTailUiWizardSelectionResult {
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
    return logTailUiWizardNavigate(
      {
        ...plan,
        inspection: {
          ...plan.inspection,
          errorsOnly: !plan.inspection.errorsOnly,
        },
      },
      "inspect",
    );
  }
  if (value === "json") {
    return logTailUiWizardNavigate(
      {
        ...plan,
        inspection: {
          ...plan.inspection,
          jsonLines: !plan.inspection.jsonLines,
        },
      },
      "inspect",
    );
  }
  return { action: "none" };
}

/** Builds preview action rows. */
export function logTailUiWizardPreviewOptions(): LogTailUiWizardSelectOption[] {
  return [
    { description: "Run canonical command", name: "Run", value: "run" },
    { description: "Return to the previous step", name: "Back", value: "back" },
  ];
}

/** Applies a preview action after validation has already produced any current errors. */
export function logTailUiWizardResolvePreviewSelection(
  plan: LogTailUiPlan,
  value: string | undefined,
  validationErrors: readonly string[],
): LogTailUiWizardSelectionResult {
  if (value === "back") {
    return logTailUiWizardNavigate(
      plan,
      plan.kind === "list-runs" ? "menu" : "inspect",
    );
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
  return logTailUiWizardNavigate(
    plan,
    plan.mode === "tail" ? "live" : "history",
  );
}

/** Appends one line to a rolling display buffer. */
export function logTailUiWizardAppendBoundedLine(
  lines: readonly string[],
  line: string,
  maxLines: number,
): string[] {
  return [...lines, line].slice(-maxLines);
}

/** Appends text to a rolling character buffer. */
export function logTailUiWizardAppendBoundedText(
  previous: string,
  chunk: string,
  maxCharacters: number,
): string {
  return (previous + chunk).slice(-maxCharacters);
}

/** Splits a text buffer into the last non-empty lines for scrollable terminal display. */
export function logTailUiWizardSplitBufferedText(
  text: string,
  maxLines: number,
): string[] {
  return text
    .split(/\r?\n/u)
    .filter((line) => line.length > 0)
    .slice(-maxLines);
}
