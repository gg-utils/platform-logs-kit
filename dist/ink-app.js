import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Reusable Ink renderer for config-driven log-tail wizards.
 *
 * Flow: injected log config + wizard config -> package-owned screen transitions -> canonical
 * `npx tsx` child process helpers, history snapshots, live stream buffers, and Ink screens.
 * Root adapters keep project config binding and launch compatibility.
 *
 * @testing Root smoke: `npm run logs:cli:ink:test`.
 * @see packages/platform-logs-kit/src/wizard-model.ts - Shared wizard rows and transitions.
 * @documentation reviewed=2026-05-21 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { Box, Static, Text, useInput, useIsScreenReaderEnabled } from "ink";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { logTailUiBuildCanonicalArgv } from "./build-argv.js";
import { logTailUiFilterLines } from "./inspect.js";
import { logTailUiBuildPreviewPlainText } from "./preview-plain.js";
import { logTailUiResolveHistoryFiles } from "./resolve-log-targets.js";
import { logTailUiSnapshotViewFiles } from "./snapshot.js";
import { logTailUiDefaultViewPlan } from "./types.js";
import { logTailUiValidateViewPlan } from "./validate-plan.js";
import { logTailUiWizardBudgetOptions, logTailUiWizardEntryOptions, logTailUiWizardInspectOptions, logTailUiWizardModeOptions, logTailUiWizardResolveBudgetSelection, logTailUiWizardResolveEntrySelection, logTailUiWizardResolveInspectSelection, logTailUiWizardResolveModeSelection, logTailUiWizardResolvePreviewSelection, logTailUiWizardResolveScopeSelection, logTailUiWizardScopeOptions, logTailUiWizardSplitBufferedText, } from "./wizard-model.js";
import { PlatformLogsKit_spawnNpxTsxOnce, PlatformLogsKit_spawnNpxTsxStream, } from "./ui-launcher.js";
const LogTailInkContext = createContext(null);
/**
 * Returns the active LogTail Ink context from the nearest provider.
 *
 * @remarks Call only under `LogTailInkContext.Provider`; missing provider indicates a render wiring bug.
 * @returns Current plan, updater, and absolute project root for downstream screens.
 * @throws {Error} When no provider wraps the calling component.
 */
function useLogTailInkContext() {
    const ctx = useContext(LogTailInkContext);
    if (ctx === null) {
        throw new Error("LogTailInkContext missing");
    }
    return ctx;
}
/**
 * Landing menu: pick configured log source modes or list run files.
 *
 * @remarks Number keys set `plan` and navigate forward; Esc exits the process immediately.
 * @returns Entry route UI with keyboard hints for operators.
 */
function EntryScreen() {
    const navigate = useNavigate();
    const { config, setPlan, wizardConfig } = useLogTailInkContext();
    const sr = useIsScreenReaderEnabled();
    const entryOptions = logTailUiWizardEntryOptions(wizardConfig, {
        includeInkHiddenOptions: false,
    });
    useInput((_input, key) => {
        if (key.escape) {
            process.exit(0);
        }
        const option = entryOptions[Number.parseInt(_input, 10) - 1];
        const result = logTailUiWizardResolveEntrySelection(config, wizardConfig, option?.value);
        if (result.action === "exit") {
            process.exit(0);
        }
        if (result.action === "navigate") {
            setPlan(result.plan);
            navigate(result.nextRoute);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, color: "cyan", children: "Log tail (Ink)" }), _jsx(Text, { dimColor: true, children: sr
                    ? "Screen reader: use number keys."
                    : `${entryOptions
                        .map((option, index) => `${String(index + 1)} ${option.name}`)
                        .join(" · ")} · Esc exit` }), entryOptions.map((option, index) => (_jsxs(Text, { children: [String(index + 1), " ", option.description] }, option.value)))] }));
}
/**
 * Chooses the configured run-log scope.
 *
 * @remarks Esc navigates back; digits map to configured scope ids then route to `/mode`.
 * @returns Scope picker with current selection echo when `plan` is a view.
 */
function ScopeScreen() {
    const navigate = useNavigate();
    const { config, plan, setPlan, wizardConfig } = useLogTailInkContext();
    const scopeOptions = logTailUiWizardScopeOptions(config, wizardConfig, {
        includeBackOption: false,
    });
    useInput((_input, key) => {
        if (key.escape) {
            navigate(-1);
        }
        const option = scopeOptions[Number.parseInt(_input, 10) - 1];
        const result = logTailUiWizardResolveScopeSelection(plan, option?.value);
        if (result.action === "navigate") {
            setPlan(result.plan);
            navigate(result.nextRoute);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Log scope" }), _jsxs(Text, { dimColor: true, children: ["Esc back \u00B7 1\u2013", scopeOptions.length, " select"] }), scopeOptions.map((option, index) => (_jsxs(Text, { children: [String(index + 1), " ", option.name, " (", option.description, ")"] }, option.value))), plan.kind === "view" ? (_jsxs(Text, { dimColor: true, children: ["Current: ", plan.scope] })) : null] }));
}
/**
 * Selects follow-live tailing versus history snapshot for the current view plan.
 *
 * @remarks Updates `plan.mode` for view plans only, then advances to the budget step.
 * @returns Mode choice UI bound to the shared plan context.
 */
function ModeScreen() {
    const navigate = useNavigate();
    const { config, plan, setPlan, wizardConfig } = useLogTailInkContext();
    const modeOptions = logTailUiWizardModeOptions({ includeBackOption: false });
    useInput((_input, key) => {
        if (key.escape) {
            navigate(-1);
            return;
        }
        const option = modeOptions[Number.parseInt(_input, 10) - 1];
        const result = logTailUiWizardResolveModeSelection(wizardConfig, plan, option?.value);
        if (result.action === "navigate") {
            setPlan(result.plan);
            navigate(result.nextRoute);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Mode" }), _jsx(Text, { dimColor: true, children: "Esc home \u00B7 1 follow \u00B7 2 history snapshot" }), modeOptions.map((option, index) => (_jsxs(Text, { children: [String(index + 1), " ", option.name, " (", option.description, ")"] }, option.value)))] }));
}
/**
 * Applies a preset line/char/token budget aligned with default npm log shortcuts.
 *
 * @remarks Mutates selector fields on view plans and routes to inspection filters.
 * @returns Budget preset menu with escape-to-parent navigation.
 */
function BudgetScreen() {
    const navigate = useNavigate();
    const { config, plan, setPlan, wizardConfig } = useLogTailInkContext();
    const budgetOptions = logTailUiWizardBudgetOptions(config, {
        includeBackOption: false,
    });
    useInput((_input, key) => {
        if (key.escape) {
            navigate(-1);
            return;
        }
        const option = budgetOptions[Number.parseInt(_input, 10) - 1];
        const result = logTailUiWizardResolveBudgetSelection(config, plan, option?.value);
        if (result.action === "navigate") {
            setPlan(result.plan);
            navigate(result.nextRoute);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Budget preset" }), _jsx(Text, { dimColor: true, children: "Esc back \u00B7 matches default npm shortcuts" }), budgetOptions.map((option, index) => (_jsxs(Text, { children: [String(index + 1), " ", option.name] }, option.value)))] }));
}
/**
 * Toggles inspection filters (errors-only, JSON-lines) before previewing or executing the plan.
 *
 * @remarks Keyboard `e`/`j` flip flags on view plans; Enter advances to preview; Esc goes back.
 * @returns Filter summary and operator instructions for the current view plan.
 */
function InspectScreen() {
    const navigate = useNavigate();
    const { config, plan, setPlan, wizardConfig } = useLogTailInkContext();
    const inspectOptions = logTailUiWizardInspectOptions({
        includeBackOption: false,
    });
    const view = plan.kind === "view" ? plan : null;
    useInput((_input, key) => {
        if (key.escape) {
            navigate(-1);
            return;
        }
        const keyboardValue = _input === "e" ? "errors" : _input === "j" ? "json" : undefined;
        const result = logTailUiWizardResolveInspectSelection(plan, key.return ? "continue" : keyboardValue);
        if (result.action === "navigate") {
            setPlan(result.plan);
            navigate(result.nextRoute);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Inspection filters" }), _jsx(Text, { dimColor: true, children: "e errors \u00B7 j JSON-lines \u00B7 Enter preview \u00B7 Esc back" }), view !== null ? (_jsxs(_Fragment, { children: [_jsxs(Text, { children: ["errorsOnly=", String(view.inspection.errorsOnly), " jsonLines=", String(view.inspection.jsonLines)] }), inspectOptions.map((option) => (_jsxs(Text, { dimColor: true, children: [option.name, ": ", option.description] }, option.value)))] })) : (_jsx(Text, { children: "No view plan" }))] }));
}
/**
 * Renders a plain-text preview of the resolved plan and gates execution on validation.
 *
 * @remarks Builds preview via `logTailUiBuildPreviewPlainText`; Enter routes to tail/history/list flows when valid.
 * @returns Preview text plus inline validation errors for view plans.
 */
function PreviewScreen() {
    const navigate = useNavigate();
    const { config, plan } = useLogTailInkContext();
    const preview = useMemo(() => {
        try {
            return logTailUiBuildPreviewPlainText(config, plan);
        }
        catch (e) {
            return e instanceof Error ? e.message : String(e);
        }
    }, [config, plan]);
    useInput((_input, key) => {
        if (key.escape) {
            navigate(-1);
            return;
        }
        if (key.return) {
            const errs = plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];
            const result = logTailUiWizardResolvePreviewSelection(plan, "run", errs);
            if (result.action === "navigate") {
                navigate(result.nextRoute);
            }
        }
    });
    const errs = plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Preview" }), _jsx(Text, { dimColor: true, children: "Enter run \u00B7 Esc back" }), errs.length > 0 ? _jsx(Text, { color: "red", children: errs.join(" ") }) : null, _jsx(Text, { children: preview })] }));
}
/**
 * Streams output from the canonical list-runs CLI into a capped rolling buffer.
 *
 * @remarks Spawns `npx tsx` against the resolved script; cancels the subprocess on unmount or navigation away.
 * @returns Static list UI showing recent CLI lines with completion hint when the task settles.
 */
function RunListScreen() {
    const navigate = useNavigate();
    const { config, plan, projectRoot } = useLogTailInkContext();
    const [lines, setLines] = useState([]);
    const [done, setDone] = useState(false);
    useInput((_input, key) => {
        if (key.escape || _input === "q") {
            navigate("/");
        }
    });
    useEffect(() => {
        const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, plan);
        let cancelled = false;
        PlatformLogsKit_spawnNpxTsxOnce({
            repoRoot: projectRoot,
            scriptPathUnderRepo: scriptRelative,
            args: argv,
        })
            .then((result) => {
            if (cancelled) {
                return;
            }
            setLines(logTailUiWizardSplitBufferedText(`${result.stdout}\n${result.stderr}`, 400));
            setDone(true);
        })
            .catch((error) => {
            if (cancelled) {
                return;
            }
            setLines([error instanceof Error ? error.message : String(error)]);
            setDone(true);
        });
        return () => {
            cancelled = true;
        };
    }, [config, plan, projectRoot]);
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsxs(Text, { bold: true, children: ["List runs ", done ? "(done)" : ""] }), _jsx(Text, { dimColor: true, children: "q / Esc home" }), lines.length > 0 ? (_jsx(Static, { items: lines, children: (line, index) => _jsx(Text, { children: line }, `k-${String(index)}`) })) : null] }));
}
/**
 * Follows live logs by spawning the canonical tail helper and streaming stdout lines.
 *
 * @remarks Keeps a subprocess ref for cooperative cancel on `q`/Esc; buffers the last 500 lines for display.
 * @returns Live tail view with stop instructions; no stdin forwarding to the child process.
 */
function RunTailScreen() {
    const navigate = useNavigate();
    const { config, plan, projectRoot } = useLogTailInkContext();
    const [lines, setLines] = useState([]);
    const cancelRef = useRef(null);
    useInput((_input, key) => {
        if (key.escape || _input === "q") {
            cancelRef.current?.();
            navigate("/");
        }
    });
    useEffect(() => {
        if (plan.kind !== "view") {
            return;
        }
        const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, plan);
        const { cancel } = PlatformLogsKit_spawnNpxTsxStream({
            repoRoot: projectRoot,
            scriptPathUnderRepo: scriptRelative,
            args: argv,
            handlers: {
                onStdoutChunk: (chunk) => {
                    setLines((previous) => logTailUiWizardSplitBufferedText(`${previous.join("\n")}\n${chunk}`, 500));
                },
                onStderrChunk: (chunk) => {
                    setLines((previous) => logTailUiWizardSplitBufferedText(`${previous.join("\n")}\n${chunk}`, 500));
                },
            },
        });
        cancelRef.current = cancel;
        return () => {
            cancel();
            cancelRef.current = null;
        };
    }, [config, plan, projectRoot]);
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "Live tail" }), _jsx(Text, { dimColor: true, children: "q / Esc stop and home \u00B7 stdin is not forwarded to tail" }), lines.length > 0 ? (_jsx(Static, { items: lines, children: (line, index) => _jsx(Text, { children: line }, `t-${String(index)}`) })) : null] }));
}
/**
 * Loads recent on-disk log files for the current view plan and applies inspection filters.
 *
 * @remarks Resolves paths from `projectRoot`, snapshots readable files once, and surfaces I/O errors inline.
 * @returns Filtered history snapshot or a red error panel when resolution fails.
 */
function RunHistoryScreen() {
    const navigate = useNavigate();
    const { config, plan, projectRoot } = useLogTailInkContext();
    const [error, setError] = useState(null);
    const [lines, setLines] = useState([]);
    useInput((_input, key) => {
        if (key.escape || _input === "q") {
            navigate("/");
        }
    });
    useEffect(() => {
        if (plan.kind !== "view") {
            return;
        }
        try {
            const files = logTailUiResolveHistoryFiles(config, projectRoot, plan);
            if (files.length === 0) {
                setError("No log files found for this source/scope.");
                return;
            }
            const snap = logTailUiSnapshotViewFiles({ filePaths: files, plan });
            setLines(logTailUiFilterLines(snap.lines, plan.inspection));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [config, plan, projectRoot]);
    if (error !== null) {
        return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { color: "red", children: error }), _jsx(Text, { dimColor: true, children: "q / Esc home" })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { bold: true, children: "History snapshot" }), _jsx(Text, { dimColor: true, children: "q / Esc home" }), lines.length > 0 ? (_jsx(Static, { items: lines, children: (line, index) => _jsx(Text, { children: line }, `h-${String(index)}`) })) : null] }));
}
/**
 * Declares MemoryRouter routes for the log-tail wizard screens in navigation order.
 *
 * @remarks Paths are relative to the in-memory router base; keep in sync with `useNavigate` targets in screens.
 * @returns Nested `Routes` mapping each path to its screen component.
 */
function RouterTree() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(EntryScreen, {}) }), _jsx(Route, { path: "/scope", element: _jsx(ScopeScreen, {}) }), _jsx(Route, { path: "/mode", element: _jsx(ModeScreen, {}) }), _jsx(Route, { path: "/budget", element: _jsx(BudgetScreen, {}) }), _jsx(Route, { path: "/inspect", element: _jsx(InspectScreen, {}) }), _jsx(Route, { path: "/preview", element: _jsx(PreviewScreen, {}) }), _jsx(Route, { path: "/run-list", element: _jsx(RunListScreen, {}) }), _jsx(Route, { path: "/run-tail", element: _jsx(RunTailScreen, {}) }), _jsx(Route, { path: "/run-history", element: _jsx(RunHistoryScreen, {}) })] }));
}
export function PlatformLogsKitInkApp({ config, projectRoot, wizardConfig, }) {
    const [plan, setPlan] = useState(logTailUiDefaultViewPlan(config));
    const value = useMemo(() => ({
        config,
        plan,
        setPlan,
        projectRoot,
        wizardConfig,
    }), [config, plan, projectRoot, wizardConfig]);
    return (_jsx(LogTailInkContext.Provider, { value: value, children: _jsx(MemoryRouter, { initialEntries: ["/"], initialIndex: 0, children: _jsx(RouterTree, {}) }) }));
}
//# sourceMappingURL=ink-app.js.map