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
import React from "react";
import type { PlatformLogsKit_Config } from "./types.js";
import { type PlatformLogsKit_WizardConfig } from "./wizard-model.js";
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
export declare function PlatformLogsKitInkApp({ config, projectRoot, wizardConfig, }: PlatformLogsKit_InkAppProps): React.ReactElement;
//# sourceMappingURL=ink-app.d.ts.map