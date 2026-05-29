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
import type { PlatformLogsKit_Config } from "./types.js";
import type { PlatformLogsKit_WizardConfig } from "./wizard-model.js";
/** Props required by the reusable OpenTUI log-tail renderer. */
export type PlatformLogsKit_OpenTuiAppProps = {
    config: PlatformLogsKit_Config;
    projectRoot: string;
    wizardConfig: PlatformLogsKit_WizardConfig;
};
/** OpenTUI operator flow for configuring log-tail plans, previews, live tails, and snapshots. */
export declare function PlatformLogsKitOpenTuiApp({ config, projectRoot, wizardConfig, }: PlatformLogsKit_OpenTuiAppProps): ReactElement;
//# sourceMappingURL=opentui-app.d.ts.map