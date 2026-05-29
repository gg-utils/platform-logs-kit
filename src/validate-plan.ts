/**
 * @fileoverview Validates configured log-tail view plans before argv, previews, or sessions run.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/types.ts - Plan/config shapes whose invariants are enforced.
 * @see packages/platform-logs-kit/src/build-argv.ts - Builder that calls this validator.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import {
  logTail_isCharsPerTokenFormat,
  logTail_isPositiveIntString,
  logTail_parseCharsPerTokenStrictPositive,
} from "@gg-utils/platform-logs-core/validation";
import type { LogTailUiPlan, PlatformLogsKit_Config } from "./types.js";
import {
  platformLogsKitFindScope,
  platformLogsKitFindSource,
} from "./types.js";

/** Collects validation errors for a view plan without throwing. */
export function logTailUiValidateViewPlan(
  config: PlatformLogsKit_Config,
  plan: Extract<LogTailUiPlan, { kind: "view" }>,
): string[] {
  const errors: string[] = [];
  const source = platformLogsKitFindSource(config, plan.source);
  if (source === undefined) {
    errors.push(`Unknown log source: ${plan.source}.`);
  } else if (platformLogsKitFindScope(source, plan.scope) === undefined) {
    errors.push(
      `Unknown log scope '${plan.scope}' for source '${plan.source}'.`,
    );
  }

  if (!logTail_isPositiveIntString(plan.selectorValue)) {
    errors.push("Selector value must be a positive integer.");
  }

  if (!logTail_isPositiveIntString(plan.runIndex)) {
    errors.push("run-index must be a positive integer.");
  }

  if (plan.selectorKind === "tokens") {
    if (!logTail_isCharsPerTokenFormat(plan.charsPerToken)) {
      errors.push("Invalid chars-per-token format.");
    } else {
      try {
        logTail_parseCharsPerTokenStrictPositive(plan.charsPerToken);
      } catch {
        errors.push("chars-per-token must be a positive number.");
      }
    }
  }

  if (
    plan.timeoutSeconds !== "" &&
    !logTail_isPositiveIntString(plan.timeoutSeconds)
  ) {
    errors.push("timeout-seconds must be a positive integer when set.");
  }

  return errors;
}

/** Throws when `logTailUiValidateViewPlan` finds blocking issues. */
export function logTailUiAssertValidViewPlan(
  config: PlatformLogsKit_Config,
  plan: Extract<LogTailUiPlan, { kind: "view" }>,
): void {
  const errors = logTailUiValidateViewPlan(config, plan);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}
