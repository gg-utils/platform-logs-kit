import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { logTailUiBuildCanonicalArgv } from "./build-argv.js";
import { logTailUiFilterLines } from "./inspect.js";
import { logTailUiBuildPreviewPlainText } from "./preview-plain.js";
import { logTailUiResolveHistoryFiles } from "./resolve-log-targets.js";
import { logTailUiSnapshotViewFiles } from "./snapshot.js";
import { logTailUiDefaultViewPlan } from "./types.js";
import { PlatformLogsKit_spawnNpxTsxOnce, PlatformLogsKit_spawnNpxTsxStream, } from "./ui-launcher.js";
import { logTailUiValidateViewPlan } from "./validate-plan.js";
import { logTailUiWizardAppendBoundedText, logTailUiWizardBudgetOptions, logTailUiWizardEntryOptions, logTailUiWizardInspectOptions, logTailUiWizardModeOptions, logTailUiWizardPreviewOptions, logTailUiWizardResolveBudgetSelection, logTailUiWizardResolveEntrySelection, logTailUiWizardResolveInspectSelection, logTailUiWizardResolveModeSelection, logTailUiWizardResolvePreviewSelection, logTailUiWizardResolveScopeSelection, logTailUiWizardScopeOptions, logTailUiWizardSplitBufferedText, } from "./wizard-model.js";
/** OpenTUI operator flow for configuring log-tail plans, previews, live tails, and snapshots. */
export function PlatformLogsKitOpenTuiApp({ config, projectRoot, wizardConfig, }) {
    const [screen, setScreen] = useState("menu");
    const [plan, setPlan] = useState(logTailUiDefaultViewPlan(config));
    const [liveLog, setLiveLog] = useState("");
    const [historyLines, setHistoryLines] = useState([]);
    const [historyError, setHistoryError] = useState(null);
    const [listOut, setListOut] = useState("");
    const cancelRef = useRef(null);
    useEffect(() => {
        return () => {
            cancelRef.current?.();
        };
    }, []);
    const previewText = useMemo(() => {
        try {
            return logTailUiBuildPreviewPlainText(config, plan);
        }
        catch (e) {
            return e instanceof Error ? e.message : String(e);
        }
    }, [config, plan]);
    const previewErrors = plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];
    useEffect(() => {
        if (screen !== "live" || plan.kind !== "view" || plan.mode !== "tail") {
            return;
        }
        setLiveLog("");
        const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, plan);
        const { cancel } = PlatformLogsKit_spawnNpxTsxStream({
            repoRoot: projectRoot,
            scriptPathUnderRepo: scriptRelative,
            args: argv,
            handlers: {
                onStdoutChunk: (chunk) => {
                    setLiveLog((p) => logTailUiWizardAppendBoundedText(p, chunk, 24_000));
                },
                onStderrChunk: (chunk) => {
                    setLiveLog((p) => logTailUiWizardAppendBoundedText(p, chunk, 24_000));
                },
            },
        });
        cancelRef.current = cancel;
        return () => {
            cancel();
            cancelRef.current = null;
        };
    }, [config, screen, plan, projectRoot]);
    useEffect(() => {
        if (screen !== "history" || plan.kind !== "view") {
            return;
        }
        setHistoryError(null);
        setHistoryLines([]);
        try {
            const files = logTailUiResolveHistoryFiles(config, projectRoot, plan);
            if (files.length === 0) {
                setHistoryError("No log files found.");
                return;
            }
            const snap = logTailUiSnapshotViewFiles({ filePaths: files, plan });
            setHistoryLines(logTailUiFilterLines(snap.lines, plan.inspection));
        }
        catch (e) {
            setHistoryError(e instanceof Error ? e.message : String(e));
        }
    }, [config, screen, plan, projectRoot]);
    useEffect(() => {
        if (screen !== "list") {
            return;
        }
        setListOut("");
        const { scriptRelative, argv } = logTailUiBuildCanonicalArgv(config, {
            kind: "list-runs",
        });
        PlatformLogsKit_spawnNpxTsxOnce({
            repoRoot: projectRoot,
            scriptPathUnderRepo: scriptRelative,
            args: argv,
        }).then((r) => {
            setListOut(`${r.stdout}\n${r.stderr}`.trim());
        });
    }, [config, screen, projectRoot]);
    /** Cancels an active live stream and returns to the main menu. */
    function stopLive() {
        cancelRef.current?.();
        cancelRef.current = null;
        setScreen("menu");
    }
    if (screen === "menu") {
        const menuOptions = logTailUiWizardEntryOptions(wizardConfig, {
            includeInkHiddenOptions: true,
        });
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Log tail (OpenTUI) \u2014 Bun entry \u00B7 alternate screen" }), _jsx("text", { children: "Child logs: Node npx tsx canonical scripts" }), _jsx("tab-select", { options: menuOptions, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolveEntrySelection(config, wizardConfig, option?.value);
                        if (result.action === "exit") {
                            process.kill(process.pid, "SIGINT");
                            return;
                        }
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "scope") {
        const scopeOptions = logTailUiWizardScopeOptions(config, wizardConfig, {
            includeBackOption: true,
        });
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Log scope" }), _jsx("tab-select", { options: scopeOptions, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolveScopeSelection(plan, option?.value);
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "mode") {
        const modeOptions = logTailUiWizardModeOptions({ includeBackOption: true });
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Mode" }), _jsx("tab-select", { options: modeOptions, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolveModeSelection(wizardConfig, plan, option?.value);
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "budget") {
        const budgetOptions = logTailUiWizardBudgetOptions(config, {
            includeBackOption: true,
        });
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Budget preset" }), _jsx("tab-select", { options: budgetOptions, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolveBudgetSelection(config, plan, option?.value);
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "inspect") {
        const inspectOptions = logTailUiWizardInspectOptions({
            includeBackOption: true,
        });
        const view = plan.kind === "view" ? plan : null;
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Inspection" }), view !== null ? (_jsxs("text", { children: ["errorsOnly=", String(view.inspection.errorsOnly), " jsonLines=", String(view.inspection.jsonLines)] })) : null, _jsx("tab-select", { options: inspectOptions, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolveInspectSelection(plan, option?.value);
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "preview") {
        const nav = logTailUiWizardPreviewOptions();
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Preview" }), previewErrors.length > 0 ? (_jsx("text", { children: `ERROR: ${previewErrors.join(" ")}` })) : null, _jsx("scrollbox", { style: { flexGrow: 1, maxHeight: 14 }, children: _jsx("box", { style: { flexDirection: "column", gap: 0 }, children: previewText.split("\n").map((line, i) => (_jsx("text", { children: line }, `p-${String(i)}`))) }) }), _jsx("tab-select", { options: nav, showDescription: true, onSelect: (_i, option) => {
                        const result = logTailUiWizardResolvePreviewSelection(plan, option?.value, previewErrors);
                        if (result.action === "navigate") {
                            setPlan(result.plan);
                            setScreen(result.nextScreen);
                        }
                    } })] }));
    }
    if (screen === "live") {
        const lines = logTailUiWizardSplitBufferedText(liveLog, 400);
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "Live tail (streamed stdout/stderr)" }), _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsxs("box", { style: { flexDirection: "column", gap: 0 }, children: [lines.length === 0 ? _jsx("text", { children: "(waiting for output\u2026)" }) : null, lines.map((line, i) => (_jsx("text", { children: line }, `lv-${String(i)}`)))] }) }), _jsx("tab-select", { options: [
                        {
                            description: "Stop and return to menu",
                            name: "Stop",
                            value: "stop",
                        },
                    ], showDescription: true, onSelect: () => {
                        stopLive();
                    } })] }));
    }
    if (screen === "history") {
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "History snapshot" }), historyError !== null ? _jsx("text", { children: `ERROR: ${historyError}` }) : null, _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsx("box", { style: { flexDirection: "column", gap: 0 }, children: historyLines.map((line, i) => (_jsx("text", { children: line }, `hi-${String(i)}`))) }) }), _jsx("tab-select", { options: [{ description: "Menu", name: "Menu", value: "m" }], showDescription: true, onSelect: () => {
                        setScreen("menu");
                    } })] }));
    }
    if (screen === "list") {
        return (_jsxs("box", { style: { flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }, children: [_jsx("text", { children: "List runs" }), _jsx("scrollbox", { style: { flexGrow: 1 }, children: _jsxs("box", { style: { flexDirection: "column", gap: 0 }, children: [listOut.length === 0 ? _jsx("text", { children: "(loading\u2026)" }) : null, listOut.split("\n").map((line, i) => (_jsx("text", { children: line }, `ls-${String(i)}`)))] }) }), _jsx("tab-select", { options: [{ description: "Menu", name: "Menu", value: "m" }], showDescription: true, onSelect: () => {
                        setScreen("menu");
                    } })] }));
    }
    return (_jsx("box", { children: _jsx("text", { children: "Unknown screen" }) }));
}
//# sourceMappingURL=opentui-app.js.map