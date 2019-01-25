"use strict";
import * as vscode from "vscode";

import {
  isTest,
  getCorrespondingTestFilePath,
  openNewTab,
  getCorrespondingSourceFilePath,
  getClosestIndexFilePaths,
  getListOfIndexFiles,
  getCurrentAbsolutePath,
  relativeRootToAbsolute
} from "./helpers";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("extension.jumpTest", () => {
    // The code you place here will be executed every time your command is executed

    const activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;

    if (isTest(activeFilePath)) {
      const sourceFilePath = getCorrespondingSourceFilePath(activeFilePath);
      openNewTab(sourceFilePath);
    } else {
      const testFilePath = getCorrespondingTestFilePath(activeFilePath);
      openNewTab(testFilePath);
    }
  });

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "extension.jumpIndex",
    async () => {
      const activeFilePath = getCurrentAbsolutePath();
      if (!activeFilePath) {
        vscode.window.showErrorMessage(`Open a file first`);
        return;
      }

      const indexFilePaths = await getClosestIndexFilePaths(activeFilePath);

      if (indexFilePaths.length === 0) {
        vscode.window.showErrorMessage(`Couldn't find an index file`);
      } else if (indexFilePaths.length === 1) {
        openNewTab(indexFilePaths[0]);
      } else {
        vscode.window.showErrorMessage(`Found multiple index files`);
      }
    }
  );

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "extension.listIndex",
    async () => {
      const items = await getListOfIndexFiles();

      const quickPick = vscode.window.createQuickPick();
      quickPick.items = items;

      quickPick.onDidChangeValue(async filterValue => {
        quickPick.items = await getListOfIndexFiles(filterValue);
      });

      quickPick.onDidAccept(async () => {
        quickPick.selectedItems.forEach(selectedItem => {
          openNewTab(relativeRootToAbsolute(selectedItem.detail));
        });
      });

      quickPick.show();
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
