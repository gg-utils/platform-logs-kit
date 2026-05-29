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

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Static, Text, useInput, useIsScreenReaderEnabled } from "ink";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { logTailUiBuildCanonicalArgv } from "./build-argv.js";
import { logTailUiFilterLines } from "./inspect.js";
import { logTailUiBuildPreviewPlainText } from "./preview-plain.js";
import { logTailUiResolveHistoryFiles } from "./resolve-log-targets.js";
import { logTailUiSnapshotViewFiles } from "./snapshot.js";
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
import { logTailUiDefaultViewPlan } from "./types.js";
import { logTailUiValidateViewPlan } from "./validate-plan.js";
import {
  logTailUiWizardBudgetOptions,
  logTailUiWizardEntryOptions,
  logTailUiWizardInspectOptions,
  logTailUiWizardModeOptions,
  logTailUiWizardResolveBudgetSelection,
  logTailUiWizardResolveEntrySelection,
  logTailUiWizardResolveInspectSelection,
  logTailUiWizardResolveModeSelection,
  logTailUiWizardResolvePreviewSelection,
  logTailUiWizardResolveScopeSelection,
  logTailUiWizardScopeOptions,
  logTailUiWizardSplitBufferedText,
  type PlatformLogsKit_WizardConfig,
} from "./wizard-model.js";
import {
  PlatformLogsKit_spawnNpxTsxOnce,
  PlatformLogsKit_spawnNpxTsxStream,
} from "./ui-launcher.js";

/**
 * React context contract for plan state and project root shared across wizard screens.
 *
 * @remarks All screens read/write `plan` through this shape; `projectRoot` resolves canonical scripts and log paths.
 */
type LogTailInkContextValue = {
  config: PlatformLogsKit_Config;
  plan: LogTailUiPlan;
  projectRoot: string;
  setPlan: React.Dispatch<React.SetStateAction<LogTailUiPlan>>;
  wizardConfig: PlatformLogsKit_WizardConfig;
};

const LogTailInkContext = createContext<LogTailInkContextValue | null>(null);

/**
 * Returns the active LogTail Ink context from the nearest provider.
 *
 * @remarks Call only under `LogTailInkContext.Provider`; missing provider indicates a render wiring bug.
 * @returns Current plan, updater, and absolute project root for downstream screens.
 * @throws {Error} When no provider wraps the calling component.
 */
function useLogTailInkContext(): LogTailInkContextValue {
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
function EntryScreen(): React.ReactElement {
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
    const result = logTailUiWizardResolveEntrySelection(
      config,
      wizardConfig,
      option?.value,
    );
    if (result.action === "exit") {
      process.exit(0);
    }
    if (result.action === "navigate") {
      setPlan(result.plan);
      navigate(result.nextRoute);
    }
  });

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold color="cyan">
        Log tail (Ink)
      </Text>
      <Text dimColor>
        {sr
          ? "Screen reader: use number keys."
          : `${entryOptions
              .map((option, index) => `${String(index + 1)} ${option.name}`)
              .join(" · ")} · Esc exit`}
      </Text>
      {entryOptions.map((option, index) => (
        <Text key={option.value}>
          {String(index + 1)} {option.description}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Chooses the configured run-log scope.
 *
 * @remarks Esc navigates back; digits map to configured scope ids then route to `/mode`.
 * @returns Scope picker with current selection echo when `plan` is a view.
 */
function ScopeScreen(): React.ReactElement {
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

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Log scope</Text>
      <Text dimColor>Esc back · 1–{scopeOptions.length} select</Text>
      {scopeOptions.map((option, index) => (
        <Text key={option.value}>
          {String(index + 1)} {option.name} ({option.description})
        </Text>
      ))}
      {plan.kind === "view" ? (
        <Text dimColor>Current: {plan.scope}</Text>
      ) : null}
    </Box>
  );
}

/**
 * Selects follow-live tailing versus history snapshot for the current view plan.
 *
 * @remarks Updates `plan.mode` for view plans only, then advances to the budget step.
 * @returns Mode choice UI bound to the shared plan context.
 */
function ModeScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { config, plan, setPlan, wizardConfig } = useLogTailInkContext();
  const modeOptions = logTailUiWizardModeOptions({ includeBackOption: false });

  useInput((_input, key) => {
    if (key.escape) {
      navigate(-1);
      return;
    }
    const option = modeOptions[Number.parseInt(_input, 10) - 1];
    const result = logTailUiWizardResolveModeSelection(
      wizardConfig,
      plan,
      option?.value,
    );
    if (result.action === "navigate") {
      setPlan(result.plan);
      navigate(result.nextRoute);
    }
  });

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Mode</Text>
      <Text dimColor>Esc home · 1 follow · 2 history snapshot</Text>
      {modeOptions.map((option, index) => (
        <Text key={option.value}>
          {String(index + 1)} {option.name} ({option.description})
        </Text>
      ))}
    </Box>
  );
}

/**
 * Applies a preset line/char/token budget aligned with default npm log shortcuts.
 *
 * @remarks Mutates selector fields on view plans and routes to inspection filters.
 * @returns Budget preset menu with escape-to-parent navigation.
 */
function BudgetScreen(): React.ReactElement {
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
    const result = logTailUiWizardResolveBudgetSelection(
      config,
      plan,
      option?.value,
    );
    if (result.action === "navigate") {
      setPlan(result.plan);
      navigate(result.nextRoute);
    }
  });

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Budget preset</Text>
      <Text dimColor>Esc back · matches default npm shortcuts</Text>
      {budgetOptions.map((option, index) => (
        <Text key={option.value}>
          {String(index + 1)} {option.name}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Toggles inspection filters (errors-only, JSON-lines) before previewing or executing the plan.
 *
 * @remarks Keyboard `e`/`j` flip flags on view plans; Enter advances to preview; Esc goes back.
 * @returns Filter summary and operator instructions for the current view plan.
 */
function InspectScreen(): React.ReactElement {
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
    const keyboardValue =
      _input === "e" ? "errors" : _input === "j" ? "json" : undefined;
    const result = logTailUiWizardResolveInspectSelection(
      plan,
      key.return ? "continue" : keyboardValue,
    );
    if (result.action === "navigate") {
      setPlan(result.plan);
      navigate(result.nextRoute);
    }
  });

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Inspection filters</Text>
      <Text dimColor>e errors · j JSON-lines · Enter preview · Esc back</Text>
      {view !== null ? (
        <>
          <Text>
            errorsOnly={String(view.inspection.errorsOnly)} jsonLines=
            {String(view.inspection.jsonLines)}
          </Text>
          {inspectOptions.map((option) => (
            <Text key={option.value} dimColor>
              {option.name}: {option.description}
            </Text>
          ))}
        </>
      ) : (
        <Text>No view plan</Text>
      )}
    </Box>
  );
}

/**
 * Renders a plain-text preview of the resolved plan and gates execution on validation.
 *
 * @remarks Builds preview via `logTailUiBuildPreviewPlainText`; Enter routes to tail/history/list flows when valid.
 * @returns Preview text plus inline validation errors for view plans.
 */
function PreviewScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { config, plan } = useLogTailInkContext();
  const preview = useMemo(() => {
    try {
      return logTailUiBuildPreviewPlainText(config, plan);
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [config, plan]);

  useInput((_input, key) => {
    if (key.escape) {
      navigate(-1);
      return;
    }
    if (key.return) {
      const errs =
        plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];
      const result = logTailUiWizardResolvePreviewSelection(plan, "run", errs);
      if (result.action === "navigate") {
        navigate(result.nextRoute);
      }
    }
  });

  const errs =
    plan.kind === "view" ? logTailUiValidateViewPlan(config, plan) : [];

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Preview</Text>
      <Text dimColor>Enter run · Esc back</Text>
      {errs.length > 0 ? <Text color="red">{errs.join(" ")}</Text> : null}
      <Text>{preview}</Text>
    </Box>
  );
}

/**
 * Streams output from the canonical list-runs CLI into a capped rolling buffer.
 *
 * @remarks Spawns `npx tsx` against the resolved script; cancels the subprocess on unmount or navigation away.
 * @returns Static list UI showing recent CLI lines with completion hint when the task settles.
 */
function RunListScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { config, plan, projectRoot } = useLogTailInkContext();
  const [lines, setLines] = useState<string[]>([]);
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
        setLines(
          logTailUiWizardSplitBufferedText(
            `${result.stdout}\n${result.stderr}`,
            400,
          ),
        );
        setDone(true);
      })
      .catch((error: unknown) => {
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

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>List runs {done ? "(done)" : ""}</Text>
      <Text dimColor>q / Esc home</Text>
      {lines.length > 0 ? (
        <Static items={lines}>
          {(line, index) => <Text key={`k-${String(index)}`}>{line}</Text>}
        </Static>
      ) : null}
    </Box>
  );
}

/**
 * Follows live logs by spawning the canonical tail helper and streaming stdout lines.
 *
 * @remarks Keeps a subprocess ref for cooperative cancel on `q`/Esc; buffers the last 500 lines for display.
 * @returns Live tail view with stop instructions; no stdin forwarding to the child process.
 */
function RunTailScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { config, plan, projectRoot } = useLogTailInkContext();
  const [lines, setLines] = useState<string[]>([]);
  const cancelRef = useRef<(() => void) | null>(null);

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
          setLines((previous) =>
            logTailUiWizardSplitBufferedText(
              `${previous.join("\n")}\n${chunk}`,
              500,
            ),
          );
        },
        onStderrChunk: (chunk) => {
          setLines((previous) =>
            logTailUiWizardSplitBufferedText(
              `${previous.join("\n")}\n${chunk}`,
              500,
            ),
          );
        },
      },
    });
    cancelRef.current = cancel;
    return () => {
      cancel();
      cancelRef.current = null;
    };
  }, [config, plan, projectRoot]);

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>Live tail</Text>
      <Text dimColor>
        q / Esc stop and home · stdin is not forwarded to tail
      </Text>
      {lines.length > 0 ? (
        <Static items={lines}>
          {(line, index) => <Text key={`t-${String(index)}`}>{line}</Text>}
        </Static>
      ) : null}
    </Box>
  );
}

/**
 * Loads recent on-disk log files for the current view plan and applies inspection filters.
 *
 * @remarks Resolves paths from `projectRoot`, snapshots readable files once, and surfaces I/O errors inline.
 * @returns Filtered history snapshot or a red error panel when resolution fails.
 */
function RunHistoryScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { config, plan, projectRoot } = useLogTailInkContext();
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [config, plan, projectRoot]);

  if (error !== null) {
    return (
      <Box flexDirection="column" gap={0}>
        <Text color="red">{error}</Text>
        <Text dimColor>q / Esc home</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={0}>
      <Text bold>History snapshot</Text>
      <Text dimColor>q / Esc home</Text>
      {lines.length > 0 ? (
        <Static items={lines}>
          {(line, index) => <Text key={`h-${String(index)}`}>{line}</Text>}
        </Static>
      ) : null}
    </Box>
  );
}

/**
 * Declares MemoryRouter routes for the log-tail wizard screens in navigation order.
 *
 * @remarks Paths are relative to the in-memory router base; keep in sync with `useNavigate` targets in screens.
 * @returns Nested `Routes` mapping each path to its screen component.
 */
function RouterTree(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<EntryScreen />} />
      <Route path="/scope" element={<ScopeScreen />} />
      <Route path="/mode" element={<ModeScreen />} />
      <Route path="/budget" element={<BudgetScreen />} />
      <Route path="/inspect" element={<InspectScreen />} />
      <Route path="/preview" element={<PreviewScreen />} />
      <Route path="/run-list" element={<RunListScreen />} />
      <Route path="/run-tail" element={<RunTailScreen />} />
      <Route path="/run-history" element={<RunHistoryScreen />} />
    </Routes>
  );
}

/**
 * Ink multi-step wizard for configured log tailing.
 *
 * @remarks Shares plan state across all screens via an internal React context.
 * @param projectRoot - Absolute path to the project root used to resolve log scripts.
 * @returns The rendered Ink application tree.
 * @example
 * ```tsx
 * import { render } from "ink";
 * import { LogTailInkApp } from "./app";
 *
 * render(<LogTailInkApp projectRoot="/workspace/project" />);
 * ```
 */
export type PlatformLogsKit_InkAppProps = {
  config: PlatformLogsKit_Config;
  projectRoot: string;
  wizardConfig: PlatformLogsKit_WizardConfig;
};

export function PlatformLogsKitInkApp({
  config,
  projectRoot,
  wizardConfig,
}: PlatformLogsKit_InkAppProps): React.ReactElement {
  const [plan, setPlan] = useState<LogTailUiPlan>(
    logTailUiDefaultViewPlan(config),
  );

  const value = useMemo(
    () => ({
      config,
      plan,
      setPlan,
      projectRoot,
      wizardConfig,
    }),
    [config, plan, projectRoot, wizardConfig],
  );

  return (
    <LogTailInkContext.Provider value={value}>
      <MemoryRouter initialEntries={["/"]} initialIndex={0}>
        <RouterTree />
      </MemoryRouter>
    </LogTailInkContext.Provider>
  );
}
