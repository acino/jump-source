"use strict";
import * as vscode from "vscode";
import {
  isTest,
  getCorrespondingTestFilePath,
  openNewTab,
  getCorrespondingSourceFilePath
} from "./helpers";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.jumpSource",
    () => {
      // The code you place here will be executed every time your command is executed

      const activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;

      if (isTest(activeFilePath)) {
        const sourceFilePath = getCorrespondingSourceFilePath(activeFilePath);
        openNewTab(sourceFilePath);
      } else {
        const testFilePath = getCorrespondingTestFilePath(activeFilePath);
        openNewTab(testFilePath);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
