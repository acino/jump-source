'use strict';
import * as vscode from 'vscode';

import {
  isTest,
  getCorrespondingTestFilePath,
  openNewTab,
  getCorrespondingSourceFilePath,
  getClosestIndexFilePaths,
  getCurrentAbsolutePath,
  createOrOpenInNewTab,
  getNextFileWithTheSameFilename,
  showPicker,
  getAllIndexFilesInWorkspace,
  PickerDisplay
} from './helpers';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.jumpTest', () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      if (isTest(activeFileUri)) {
        const sourceFileUri = getCorrespondingSourceFilePath(activeFileUri);
        openNewTab(sourceFileUri);
      } else {
        const testFileUri = getCorrespondingTestFilePath(activeFileUri);
        openNewTab(testFileUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.jumpIndex', async () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      const indexFileUris = await getClosestIndexFilePaths(activeFileUri);

      if (indexFileUris.length === 0) {
        vscode.window.showErrorMessage(`Couldn't find an index file`);
      } else if (indexFileUris.length === 1) {
        openNewTab(indexFileUris[0]);
      } else {
        vscode.window.showErrorMessage(`Found multiple index files`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.listIndex', async () => {
      const fileUris = await getAllIndexFilesInWorkspace();
      showPicker(PickerDisplay.IndexFiles, fileUris);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.createTest', async () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      if (!isTest(activeFileUri)) {
        const testFileUri = getCorrespondingTestFilePath(activeFileUri, true);
        createOrOpenInNewTab(testFileUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.cycleFilename', async () => {
      const nextFileUri = await getNextFileWithTheSameFilename();
      if (nextFileUri) {
        createOrOpenInNewTab(nextFileUri);
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
