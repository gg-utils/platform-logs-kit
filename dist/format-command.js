/**
 * @fileoverview Formats configured log-tail commands, npm shortcuts, and forwarded-arg previews.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/preview-plain.ts - Preview composer that uses these helpers.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
function platformLogsKitShellQuote(value) {
    if (value.length === 0) {
        return "''";
    }
    return `'${value.replace(/'/g, "'\\''")}'`;
}
function shortcutMatchesPlan(shortcut, plan) {
    if (shortcut.source !== plan.source) {
        return false;
    }
    if (shortcut.scope !== plan.scope) {
        return false;
    }
    if (shortcut.mode !== plan.mode) {
        return false;
    }
    if (shortcut.selectorKind !== plan.selectorKind) {
        return false;
    }
    if (shortcut.selectorValue !== plan.selectorValue) {
        return false;
    }
    if (shortcut.selectorKind === "tokens" &&
        shortcut.charsPerToken !== plan.charsPerToken) {
        return false;
    }
    return plan.runIndex === "1" && plan.timeoutSeconds === "";
}
/** Returns a matching root `npm run <script>` line when the plan matches a published shortcut. */
export function logTailUiFormatNpmRunShortcut(config, plan) {
    if (plan.kind === "list-runs") {
        return config.listRuns.npmCommand;
    }
    const shortcut = config.shortcuts.find((candidate) => shortcutMatchesPlan(candidate, plan));
    return shortcut?.npmCommand ?? null;
}
/** Formats `npm run <script>` with forwarded argv appended after `--`. */
export function logTailUiFormatNpmRunWithForwardedArgs(npmScript, forwardedArgv) {
    if (forwardedArgv.length === 0) {
        return `npm run ${npmScript}`;
    }
    return [
        "npm",
        "run",
        npmScript,
        "--",
        ...forwardedArgv.map(platformLogsKitShellQuote),
    ].join(" ");
}
/** Formats a `npx tsx <scriptRelative> [argv]` command string. */
export function logTailUiFormatTsxCommand(scriptRelative, argv) {
    return [
        "npx",
        "tsx",
        scriptRelative,
        ...argv.map(platformLogsKitShellQuote),
    ].join(" ");
}
//# sourceMappingURL=format-command.js.map