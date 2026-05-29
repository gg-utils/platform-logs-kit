/**
 * @fileoverview Reusable OpenTUI renderer for config-driven log-tail wizards.
 *
 * Flow: injected log config + wizard config -> package-owned screen transitions -> canonical
 * `npx tsx` child process helpers, history snapshots, live stream buffers, and terminal JSX.
 * Root adapters keep project config binding and launch compatibility.
 *
 * @testing Root smoke: `npm run logs:cli:opentui:test`.
 * @see packages/platform-logs-kit/src/wizard-model.ts - Shared wizard rows and transitions.
 * @documentation reviewed=2026-05-21 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { logTailUiBuildCanonicalArgv } from "./build-argv.js";
import { logTailUiFilterLines } from "./inspect.js";
import { logTailUiBuildPreviewPlainText } from "./preview-plain.js";
import { logTailUiResolveHistoryFiles } from "./resolve-log-targets.js";
import { logTailUiSnapshotViewFiles } from "./snapshot.js";
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
import { logTailUiDefaultViewPlan } from "./types.js";
import {
  PlatformLogsKit_spawnNpxTsxOnce,
  PlatformLogsKit_spawnNpxTsxStream,
} from "./ui-launcher.js";
import { logTailUiValidateViewPlan } from "./validate-plan.js";
import type {
  LogTailUiWizardScreen,
  PlatformLogsKit_WizardConfig,
} from "./wizard-model.js";
import {
  logTailUiWizardAppendBoundedText,
  logTailUiWizardBudgetOptions,
  logTailUiWizardEntryOptions,
  logTailUiWizardInspectOptions,
  logTailUiWizardModeOptions,
  logTailUiWizardPreviewOptions,
  logTailUiWizardResolveBudgetSelection,
  logTailUiWizardResolveEntrySelection,
  logTailUiWizardResolveInspectSelection,
  logTailUiWizardResolveModeSelection,
  logTailUiWizardResolvePreviewSelection,
  logTailUiWizardResolveScopeSelection,
  logTailUiWizardScopeOptions,
  logTailUiWizardSplitBufferedText,
} from "./wizard-model.js";

/** Props required by the reusable OpenTUI log-tail renderer. */
export type PlatformLogsKit_OpenTuiAppProps = {
  config: PlatformLogsKit_Config;
  projectRoot: string;
  wizardConfig: PlatformLogsKit_WizardConfig;
};

/** OpenTUI operator flow for configuring log-tail plans, previews, live tails, and snapshots. */
export function PlatformLogsKitOpenTuiApp({
  config,
  projectRoot,
  wizardConfig,
}: PlatformLogsKit_OpenTuiAppProps): ReactElement {
  const [screen, setScreen] = useState<LogTailUiWizardScreen>("menu");
  const [plan, setPlan] = useState<LogTailUiPlan>(
    logTailUiDefaultViewPlan(config),
  );
  const [liveLog, setLiveLog] = useState<string>("");
  const [historyLines, setHistoryLines] = useState<string[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [listOut, setListOut] = useState<string>("");
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  const previewText = useMemo(() => {
    try {
      return logTailUiBuildPreviewPlainText(config, plan);
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [config, plan]);

  const previewErrors =
    plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];

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
    } catch (e) {
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
  function stopLive(): void {
    cancelRef.current?.();
    cancelRef.current = null;
    setScreen("menu");
  }

  if (screen === "menu") {
    const menuOptions = logTailUiWizardEntryOptions(wizardConfig, {
      includeInkHiddenOptions: true,
    });
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Log tail (OpenTUI) — Bun entry · alternate screen</text>
        <text>Child logs: Node npx tsx canonical scripts</text>
        <tab-select
          options={menuOptions}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolveEntrySelection(
              config,
              wizardConfig,
              option?.value,
            );
            if (result.action === "exit") {
              process.kill(process.pid, "SIGINT");
              return;
            }
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "scope") {
    const scopeOptions = logTailUiWizardScopeOptions(config, wizardConfig, {
      includeBackOption: true,
    });
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Log scope</text>
        <tab-select
          options={scopeOptions}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolveScopeSelection(
              plan,
              option?.value,
            );
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "mode") {
    const modeOptions = logTailUiWizardModeOptions({ includeBackOption: true });
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Mode</text>
        <tab-select
          options={modeOptions}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolveModeSelection(
              wizardConfig,
              plan,
              option?.value,
            );
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "budget") {
    const budgetOptions = logTailUiWizardBudgetOptions(config, {
      includeBackOption: true,
    });
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Budget preset</text>
        <tab-select
          options={budgetOptions}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolveBudgetSelection(
              config,
              plan,
              option?.value,
            );
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "inspect") {
    const inspectOptions = logTailUiWizardInspectOptions({
      includeBackOption: true,
    });
    const view = plan.kind === "view" ? plan : null;
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Inspection</text>
        {view !== null ? (
          <text>
            errorsOnly={String(view.inspection.errorsOnly)} jsonLines=
            {String(view.inspection.jsonLines)}
          </text>
        ) : null}
        <tab-select
          options={inspectOptions}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolveInspectSelection(
              plan,
              option?.value,
            );
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "preview") {
    const nav = logTailUiWizardPreviewOptions();
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Preview</text>
        {previewErrors.length > 0 ? (
          <text>{`ERROR: ${previewErrors.join(" ")}`}</text>
        ) : null}
        <scrollbox style={{ flexGrow: 1, maxHeight: 14 }}>
          <box style={{ flexDirection: "column", gap: 0 }}>
            {previewText.split("\n").map((line, i) => (
              <text key={`p-${String(i)}`}>{line}</text>
            ))}
          </box>
        </scrollbox>
        <tab-select
          options={nav}
          showDescription={true}
          onSelect={(_i, option) => {
            const result = logTailUiWizardResolvePreviewSelection(
              plan,
              option?.value,
              previewErrors,
            );
            if (result.action === "navigate") {
              setPlan(result.plan);
              setScreen(result.nextScreen);
            }
          }}
        />
      </box>
    );
  }

  if (screen === "live") {
    const lines = logTailUiWizardSplitBufferedText(liveLog, 400);
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>Live tail (streamed stdout/stderr)</text>
        <scrollbox style={{ flexGrow: 1 }}>
          <box style={{ flexDirection: "column", gap: 0 }}>
            {lines.length === 0 ? <text>(waiting for output…)</text> : null}
            {lines.map((line, i) => (
              <text key={`lv-${String(i)}`}>{line}</text>
            ))}
          </box>
        </scrollbox>
        <tab-select
          options={[
            {
              description: "Stop and return to menu",
              name: "Stop",
              value: "stop",
            },
          ]}
          showDescription={true}
          onSelect={() => {
            stopLive();
          }}
        />
      </box>
    );
  }

  if (screen === "history") {
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>History snapshot</text>
        {historyError !== null ? <text>{`ERROR: ${historyError}`}</text> : null}
        <scrollbox style={{ flexGrow: 1 }}>
          <box style={{ flexDirection: "column", gap: 0 }}>
            {historyLines.map((line, i) => (
              <text key={`hi-${String(i)}`}>{line}</text>
            ))}
          </box>
        </scrollbox>
        <tab-select
          options={[{ description: "Menu", name: "Menu", value: "m" }]}
          showDescription={true}
          onSelect={() => {
            setScreen("menu");
          }}
        />
      </box>
    );
  }

  if (screen === "list") {
    return (
      <box style={{ flexDirection: "column", flexGrow: 1, gap: 1, padding: 1 }}>
        <text>List runs</text>
        <scrollbox style={{ flexGrow: 1 }}>
          <box style={{ flexDirection: "column", gap: 0 }}>
            {listOut.length === 0 ? <text>(loading…)</text> : null}
            {listOut.split("\n").map((line, i) => (
              <text key={`ls-${String(i)}`}>{line}</text>
            ))}
          </box>
        </scrollbox>
        <tab-select
          options={[{ description: "Menu", name: "Menu", value: "m" }]}
          showDescription={true}
          onSelect={() => {
            setScreen("menu");
          }}
        />
      </box>
    );
  }

  return (
    <box>
      <text>Unknown screen</text>
    </box>
  );
}
