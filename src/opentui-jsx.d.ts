/**
 * @fileoverview Augments React JSX intrinsic elements with OpenTUI terminal widget tags (`box`,
 * `scrollbox`, `text`, `tab-select`) and their prop contracts for `@gg-utils/platform-logs-kit` OpenTUI screens.
 *
 * This file owns ambient JSX augmentation on the global namespace plus `react` and
 * `react/jsx-runtime` so TypeScript accepts OpenTUI markup in package TSX without pulling in root
 * launcher scripts; runtime tag behavior still comes from the OpenTUI host wired at launch.
 * Flow: OpenTUI TSX -> intrinsic tag names -> narrowed props for layout, scrolling, text, and tabbed selects.
 *
 * @example
 * ```typescript
 * import type { ReactElement } from "react";
 *
 * export function PlatformLogsKit_OpenTuiSampleRoot(): ReactElement {
 *   return (
 *     <box style={{ flexDirection: "column", gap: 1 }}>
 *       <text>Platform logs</text>
 *       <tab-select
 *         options={[{ name: "Tail", value: "tail", description: "Stream recent lines" }]}
 *         onSelect={() => {}}
 *       />
 *     </box>
 *   );
 * }
 * ```
 *
 * @testing CLI: cd packages/platform-logs-kit && npm run type-check
 *
 * @see packages/platform-logs-kit/src/opentui-app.tsx - Log-tail OpenTUI wizard whose TSX consumes these intrinsic elements for menus, scroll regions, and tabbed selects.
 * @see packages/platform-logs-kit/src/wizard-model.ts - Wizard select option model referenced by `tab-select` props augmented here.
 * @see docs/TYPESCRIPT_STANDARDS_DOCUMENTATION_FILE_OVERVIEWS.md - Repository file-overview standard this declaration header follows for audits and agent orientation.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import type { Key, ReactNode } from "react";
import type { LogTailUiWizardSelectOption } from "./wizard-model.js";

type PlatformLogsKit_OpenTuiFlexDirection = "column" | "row";

type PlatformLogsKit_OpenTuiStyle = {
  flexDirection?: PlatformLogsKit_OpenTuiFlexDirection;
  flexGrow?: number;
  gap?: number;
  maxHeight?: number;
  padding?: number;
};

type PlatformLogsKit_OpenTuiContainerProps = {
  children?: ReactNode;
  key?: Key;
  style?: PlatformLogsKit_OpenTuiStyle;
};

type PlatformLogsKit_OpenTuiTextProps = {
  children?: ReactNode;
  key?: Key;
};

type PlatformLogsKit_OpenTuiTabSelectProps = {
  key?: Key;
  onSelect?: (
    index: number,
    option: LogTailUiWizardSelectOption | undefined,
  ) => void;
  options: readonly LogTailUiWizardSelectOption[];
  showDescription?: boolean;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: PlatformLogsKit_OpenTuiContainerProps;
      scrollbox: PlatformLogsKit_OpenTuiContainerProps;
      text: PlatformLogsKit_OpenTuiTextProps;
      "tab-select": PlatformLogsKit_OpenTuiTabSelectProps;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      box: PlatformLogsKit_OpenTuiContainerProps;
      scrollbox: PlatformLogsKit_OpenTuiContainerProps;
      text: PlatformLogsKit_OpenTuiTextProps;
      "tab-select": PlatformLogsKit_OpenTuiTabSelectProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      box: PlatformLogsKit_OpenTuiContainerProps;
      scrollbox: PlatformLogsKit_OpenTuiContainerProps;
      text: PlatformLogsKit_OpenTuiTextProps;
      "tab-select": PlatformLogsKit_OpenTuiTabSelectProps;
    }
  }
}

export {};
