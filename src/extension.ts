'use strict';
import * as vscode from 'vscode';

import {
  isTest,
  getCorrespondingTestFilePath,
  openNewTab,
  getCorrespondingSourceFilePath,
  getClosestIndexFilePaths,
  createOrOpenInNewTab,
  getNextFileWithTheSameFilename,
  showPicker,
  getAllIndexFilesInWorkspace,
  PickerDisplay
} from './helpers';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.jumpTest', () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      if (isTest(activeFileUri)) {
        const sourceFileUri = getCorrespondingSourceFilePath(activeFileUri);
        return openNewTab(sourceFileUri);
      }

      const testFileUri = getCorrespondingTestFilePath(activeFileUri);
      return openNewTab(testFileUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.jumpIndex', async () => {
      const indexFileUris = await getClosestIndexFilePaths();

      if (indexFileUris.length === 1) {
        return openNewTab(indexFileUris[0]);
      }

      if (indexFileUris.length === 0) {
        vscode.window.showErrorMessage(`Couldn't find an index file`);
      } else {
        vscode.window.showErrorMessage(`Found multiple index files`);
      }
      return Promise.resolve();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.listIndex', async () => {
      const fileUris = await getAllIndexFilesInWorkspace();
      showPicker(PickerDisplay.IndexFiles, fileUris);
      return Promise.resolve();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.createTest', async () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      if (!isTest(activeFileUri)) {
        const testFileUri = getCorrespondingTestFilePath(activeFileUri, true);
        return createOrOpenInNewTab(testFileUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.cycleFilename', async () => {
      const nextFileUri = await getNextFileWithTheSameFilename();
      if (!nextFileUri) {
        return Promise.resolve();
      }
      return openNewTab(nextFileUri);
    })
  );
}

export function deactivate() {}
