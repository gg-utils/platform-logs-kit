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
/** Renders the configured grouped menu. */
export function PlatformLogsKit_printInteractiveMenu(options) {
    options.session.clearScreen();
    options.session.printHeader(options.config.headerFamily, options.config.headerFocus);
    for (const group of options.config.groups) {
        options.session.printPanelTitle(group.title, group.subtitle);
        for (const item of group.items) {
            options.session.printMenuItem(item.key, item.label, item.description);
        }
    }
    options.session.printSectionBreak();
}
function PlatformLogsKit_findInteractiveMenuItem(options) {
    for (const group of options.config.groups) {
        for (const item of group.items) {
            if (item.key === options.choice) {
                return item;
            }
            if (item.kind === "exit" && item.aliases?.includes(options.choice)) {
                return item;
            }
        }
    }
    return undefined;
}
/** Handles one configured menu selection. */
export async function PlatformLogsKit_handleInteractiveMenuSelection(options) {
    const item = PlatformLogsKit_findInteractiveMenuItem({
        choice: options.choice,
        config: options.config,
    });
    if (item === undefined) {
        options.session.printError(options.config.invalidChoiceText(options.choice));
        return "continue";
    }
    if (item.kind === "exit") {
        options.session.printSuccess(item.exitMessage);
        return "exit";
    }
    const resolvedScript = item.kind === "dynamic-script"
        ? await item.resolveScript({ session: options.session })
        : { scriptName: item.scriptName };
    if (resolvedScript.note !== undefined) {
        options.session.printNote(resolvedScript.note);
    }
    await options.runScript({
        cwd: options.cwd,
        scriptName: resolvedScript.scriptName,
        session: options.session,
    });
    return "continue";
}
/** Runs the configured menu until an exit item or alias is selected. */
export async function PlatformLogsKit_runInteractiveMenu(options) {
    for (;;) {
        PlatformLogsKit_printInteractiveMenu({
            config: options.config,
            session: options.session,
        });
        options.session.writeLine("");
        const choice = await options.session.promptReadLine(options.config.promptText);
        options.session.writeLine("");
        const outcome = await PlatformLogsKit_handleInteractiveMenuSelection({
            choice,
            config: options.config,
            cwd: options.cwd,
            runScript: options.runScript,
            session: options.session,
        });
        if (outcome === "exit") {
            return;
        }
        options.session.writeLine("");
        await options.session.promptReadLine(options.config.continuePromptText);
    }
}
//# sourceMappingURL=interactive-menu.js.map