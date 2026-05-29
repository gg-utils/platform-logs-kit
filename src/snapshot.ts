/**
 * @fileoverview Reads recent log content from resolved files to power log-tail history UIs.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/resolve-log-targets.ts - Resolver that supplies files.
 * @documentation reviewed=2026-05-20 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import { spawnSync } from "node:child_process";
import { logTail_tokensToCharBudget } from "@gg-utils/platform-logs-core/tokens-to-char-budget";
import { logTail_parseCharsPerTokenStrictPositive } from "@gg-utils/platform-logs-core/validation";
import type { LogTailUiPlan } from "./types.js";

const MAX_LINE_UNITS = 50_000;

function capPositiveInt(raw: string, cap: number): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(n, cap);
}

/** Reads recent content from log files using `tail(1)` (non-follow). */
export function logTailUiSnapshotViewFiles(options: {
  filePaths: readonly string[];
  plan: Extract<LogTailUiPlan, { kind: "view" }>;
}): { lines: string[]; truncated: boolean } {
  const { filePaths, plan } = options;
  const allLines: string[] = [];
  let truncated = false;

  for (const filePath of filePaths) {
    let tailArgs: string[];

    if (plan.selectorKind === "lines") {
      const requested = Number.parseInt(plan.selectorValue, 10);
      const n = capPositiveInt(plan.selectorValue, MAX_LINE_UNITS);
      if (Number.isFinite(requested) && requested > MAX_LINE_UNITS) {
        truncated = true;
      }
      tailArgs = ["-n", String(n), filePath];
    } else if (plan.selectorKind === "chars") {
      const n = capPositiveInt(plan.selectorValue, MAX_LINE_UNITS * 200);
      tailArgs = ["-c", String(n), filePath];
    } else {
      const tokens = Number.parseInt(plan.selectorValue, 10);
      const cpt = logTail_parseCharsPerTokenStrictPositive(plan.charsPerToken);
      const chars = logTail_tokensToCharBudget(tokens, cpt);
      tailArgs = [
        "-c",
        String(Math.min(chars, MAX_LINE_UNITS * 200)),
        filePath,
      ];
    }

    const result = spawnSync("tail", tailArgs, {
      encoding: "utf8",
      env: process.env,
    });
    if (result.error) {
      throw result.error;
    }
    const chunk = typeof result.stdout === "string" ? result.stdout : "";
    const piece = chunk.split(/\r?\n/u);
    if (piece.length > 0 && piece[piece.length - 1] === "") {
      piece.pop();
    }
    allLines.push(...piece);
  }

  return { lines: allLines, truncated };
}
