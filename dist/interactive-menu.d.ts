/**
 * @fileoverview Reusable interactive menu loop for log command launchers.
 *
 * Flow: config-provided grouped menu rows + session abstraction + script runner -> repeated
 * prompt, preview/run dispatch, pause, and exit behavior. Project adapters own command names,
 * labels, nested selectors, and process execution details.
 *
 * @testing Node test runner (tsx): npm run platform-logs-kit:test from the repository root runs the package `tsx --test` harness over `packages/platform-logs-kit/src/*.unit.test.ts`, including `interactive-menu.unit.test.ts`, after changes here.
 *
 * @see scripts/log-tail/ui/cli-interactive/main.ts - Log-tail interactive CLI entrypoint that imports `PlatformLogsKit_runInteractiveMenu` and supplies grouped menu config plus the cwd/script runner wiring for this loop.
 * @see platform-logs.config.ts - Declares the typed grouped menu rows and copy consumed by the log-tail CLI when it builds the `PlatformLogsKit_InteractiveMenuConfig` passed into this module.
 * @see packages/platform-logs-kit/src/interactive-menu.unit.test.ts - Node `tsx --test` suite that covers grouped rendering, invalid choices, exit aliases, and the full run loop contract owned by this file.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
/** Minimal option row shape required for nested terminal selectors. */
export type PlatformLogsKit_InteractiveListOption<TValue extends string> = {
    description?: string;
    label?: string;
    value: TValue;
};
/** Minimal terminal session surface consumed by the reusable log menu loop. */
export type PlatformLogsKit_InteractiveMenuSession = {
    chooseFromList: <TValue extends string>(options: {
        items: ReadonlyArray<PlatformLogsKit_InteractiveListOption<TValue>>;
        promptSubtitle: string;
        promptTitle: string;
    }) => Promise<TValue>;
    clearScreen: () => void;
    printError: (text: string) => void;
    printHeader: (family: string, focus: string) => void;
    printMenuItem: (number: string | number, label: string, description: string) => void;
    printNote: (text: string) => void;
    printPanelTitle: (title: string, subtitle?: string) => void;
    printSectionBreak: () => void;
    printSuccess: (text: string) => void;
    promptReadLine: (promptText: string) => Promise<string>;
    writeLine: (text?: string) => void;
};
/** Resolved command returned by static and dynamic menu entries. */
export type PlatformLogsKit_InteractiveResolvedScript = {
    note?: string;
    scriptName: string;
};
/** Callback used by adapters for menu rows that need an extra selector before command dispatch. */
export type PlatformLogsKit_InteractiveResolveScript<Session extends PlatformLogsKit_InteractiveMenuSession> = (options: {
    session: Session;
}) => Promise<PlatformLogsKit_InteractiveResolvedScript>;
/** Direct menu row that maps to one configured npm script. */
export type PlatformLogsKit_InteractiveScriptItem = {
    description: string;
    key: string;
    kind: "script";
    label: string;
    scriptName: string;
};
/** Menu row whose script is resolved through an adapter-provided selector callback. */
export type PlatformLogsKit_InteractiveDynamicScriptItem<Session extends PlatformLogsKit_InteractiveMenuSession> = {
    description: string;
    key: string;
    kind: "dynamic-script";
    label: string;
    resolveScript: PlatformLogsKit_InteractiveResolveScript<Session>;
};
/** Menu row that exits the loop. */
export type PlatformLogsKit_InteractiveExitItem = {
    aliases?: readonly string[];
    description: string;
    exitMessage: string;
    key: string;
    kind: "exit";
    label: string;
};
/** One visible menu row. */
export type PlatformLogsKit_InteractiveMenuItem<Session extends PlatformLogsKit_InteractiveMenuSession> = PlatformLogsKit_InteractiveScriptItem | PlatformLogsKit_InteractiveDynamicScriptItem<Session> | PlatformLogsKit_InteractiveExitItem;
/** Group of menu rows rendered under one panel title. */
export type PlatformLogsKit_InteractiveMenuGroup<Session extends PlatformLogsKit_InteractiveMenuSession> = {
    items: readonly PlatformLogsKit_InteractiveMenuItem<Session>[];
    subtitle: string;
    title: string;
};
/** Configured copy and behavior for the reusable log menu loop. */
export type PlatformLogsKit_InteractiveMenuConfig<Session extends PlatformLogsKit_InteractiveMenuSession> = {
    continuePromptText: string;
    groups: readonly PlatformLogsKit_InteractiveMenuGroup<Session>[];
    headerFamily: string;
    headerFocus: string;
    invalidChoiceText: (choice: string) => string;
    promptText: string;
};
/** Callback used by adapters to bind resolved script names to their process runner. */
export type PlatformLogsKit_RunInteractiveScript<Session extends PlatformLogsKit_InteractiveMenuSession> = (options: {
    cwd: string;
    scriptName: string;
    session: Session;
}) => Promise<void>;
/** Outcome of one menu selection. */
export type PlatformLogsKit_InteractiveMenuOutcome = "continue" | "exit";
/** Renders the configured grouped menu. */
export declare function PlatformLogsKit_printInteractiveMenu<Session extends PlatformLogsKit_InteractiveMenuSession>(options: {
    config: PlatformLogsKit_InteractiveMenuConfig<Session>;
    session: Session;
}): void;
/** Handles one configured menu selection. */
export declare function PlatformLogsKit_handleInteractiveMenuSelection<Session extends PlatformLogsKit_InteractiveMenuSession>(options: {
    choice: string;
    config: PlatformLogsKit_InteractiveMenuConfig<Session>;
    cwd: string;
    runScript: PlatformLogsKit_RunInteractiveScript<Session>;
    session: Session;
}): Promise<PlatformLogsKit_InteractiveMenuOutcome>;
/** Runs the configured menu until an exit item or alias is selected. */
export declare function PlatformLogsKit_runInteractiveMenu<Session extends PlatformLogsKit_InteractiveMenuSession>(options: {
    config: PlatformLogsKit_InteractiveMenuConfig<Session>;
    cwd: string;
    runScript: PlatformLogsKit_RunInteractiveScript<Session>;
    session: Session;
}): Promise<void>;
//# sourceMappingURL=interactive-menu.d.ts.map