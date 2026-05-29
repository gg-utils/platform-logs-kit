/**
 * @fileoverview Verifies the reusable platform-logs interactive menu helpers for grouped rendering,
 * choice dispatch into script runners, and prompt-driven loop termination.
 *
 * This file owns Node `node:test` regression coverage for `PlatformLogsKit_printInteractiveMenu`,
 * `PlatformLogsKit_handleInteractiveMenuSelection`, and `PlatformLogsKit_runInteractiveMenu` using a
 * fake session that records terminal calls and scripted readline answers.
 * Flow: `FakeSession` + canned menu config -> render or handle selection or run loop -> assert
 * recorded lines, script invocations, and continuation/stop tokens.
 *
 * @testing Node test (tsx): cd packages/platform-logs-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/interactive-menu.unit.test.ts
 * @testing CLI: npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/interactive-menu.ts - Menu loop, session contract, and dispatch primitives whose print, handle, and run behaviors are asserted here.
 * @see scripts/log-tail/ui/cli-interactive/main.ts - Log-tail interactive CLI entrypoint that wires `PlatformLogsKit_runInteractiveMenu` with real cwd and script execution alongside grouped menus.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  PlatformLogsKit_handleInteractiveMenuSelection,
  PlatformLogsKit_printInteractiveMenu,
  PlatformLogsKit_runInteractiveMenu,
  type PlatformLogsKit_InteractiveListOption,
  type PlatformLogsKit_InteractiveMenuConfig,
  type PlatformLogsKit_InteractiveMenuSession,
} from "./interactive-menu.js";

class FakeSession implements PlatformLogsKit_InteractiveMenuSession {
  readonly lines: string[] = [];
  private readonly answers: string[];

  constructor(answers: readonly string[] = []) {
    this.answers = Array.from(answers);
  }

  async chooseFromList<TValue extends string>(options: {
    items: ReadonlyArray<PlatformLogsKit_InteractiveListOption<TValue>>;
    promptSubtitle: string;
    promptTitle: string;
  }): Promise<TValue> {
    this.lines.push(`choose:${options.promptTitle}:${options.promptSubtitle}`);
    const firstItem = options.items[0];
    if (firstItem === undefined) {
      throw new Error("Test selector requires at least one item.");
    }
    return firstItem.value;
  }

  clearScreen(): void {
    this.lines.push("clear");
  }

  printError(text: string): void {
    this.lines.push(`error:${text}`);
  }

  printHeader(family: string, focus: string): void {
    this.lines.push(`header:${family}:${focus}`);
  }

  printMenuItem(number: string | number, label: string, description: string): void {
    this.lines.push(`item:${number}:${label}:${description}`);
  }

  printNote(text: string): void {
    this.lines.push(`note:${text}`);
  }

  printPanelTitle(title: string, subtitle = ""): void {
    this.lines.push(`panel:${title}:${subtitle}`);
  }

  printSectionBreak(): void {
    this.lines.push("break");
  }

  printSuccess(text: string): void {
    this.lines.push(`success:${text}`);
  }

  async promptReadLine(promptText: string): Promise<string> {
    this.lines.push(`prompt:${promptText}`);
    return this.answers.shift() ?? "q";
  }

  writeLine(text = ""): void {
    this.lines.push(`line:${text}`);
  }
}

type TestSession = FakeSession;

const config: PlatformLogsKit_InteractiveMenuConfig<TestSession> = {
  continuePromptText: "Press Enter",
  groups: [
    {
      items: [
        {
          description: "Follow logs",
          key: "1",
          kind: "script",
          label: "Tail logs",
          scriptName: "logs",
        },
        {
          description: "Select source",
          key: "2",
          kind: "dynamic-script",
          label: "Tail selected logs",
          resolveScript: async ({ session }) => {
            const value = await session.chooseFromList({
              items: [{ description: "Primary", value: "primary" }],
              promptSubtitle: "Pick one",
              promptTitle: "Source",
            });
            return { note: `selected ${value}`, scriptName: `logs:${value}` };
          },
        },
      ],
      subtitle: "Default commands",
      title: "Logs",
    },
    {
      items: [
        {
          aliases: ["q"],
          description: "Leave",
          exitMessage: "Exiting.",
          key: "3",
          kind: "exit",
          label: "Exit",
        },
      ],
      subtitle: "Done",
      title: "Exit",
    },
  ],
  headerFamily: "LOGS",
  headerFocus: "MAIN MENU",
  invalidChoiceText: (choice) => `Invalid choice: ${choice}`,
  promptText: "Choice: ",
};

test("PlatformLogsKit_printInteractiveMenu renders grouped items", () => {
  const session = new FakeSession();

  PlatformLogsKit_printInteractiveMenu({ config, session });

  assert.deepEqual(session.lines, [
    "clear",
    "header:LOGS:MAIN MENU",
    "panel:Logs:Default commands",
    "item:1:Tail logs:Follow logs",
    "item:2:Tail selected logs:Select source",
    "panel:Exit:Done",
    "item:3:Exit:Leave",
    "break",
  ]);
});

test(
  "PlatformLogsKit_handleInteractiveMenuSelection dispatches static and dynamic rows",
  async () => {
    const session = new FakeSession();
    const runs: string[] = [];

    assert.equal(
      await PlatformLogsKit_handleInteractiveMenuSelection({
        choice: "1",
        config,
        cwd: "/repo",
        runScript: async (options) => {
          runs.push(`${options.cwd}:${options.scriptName}`);
        },
        session,
      }),
      "continue",
    );

    assert.equal(
      await PlatformLogsKit_handleInteractiveMenuSelection({
        choice: "2",
        config,
        cwd: "/repo",
        runScript: async (options) => {
          runs.push(`${options.cwd}:${options.scriptName}`);
        },
        session,
      }),
      "continue",
    );

    assert.deepEqual(runs, ["/repo:logs", "/repo:logs:primary"]);
    assert.equal(session.lines.includes("note:selected primary"), true);
  },
);

test("PlatformLogsKit_runInteractiveMenu handles invalid input then exits by alias", async () => {
  const session = new FakeSession(["bad", "", "q"]);
  const runs: string[] = [];

  await PlatformLogsKit_runInteractiveMenu({
    config,
    cwd: "/repo",
    runScript: async (options) => {
      runs.push(options.scriptName);
    },
    session,
  });

  assert.deepEqual(runs, []);
  assert.equal(session.lines.includes("error:Invalid choice: bad"), true);
  assert.equal(session.lines.includes("success:Exiting."), true);
});
