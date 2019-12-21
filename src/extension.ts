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
        openNewTab(sourceFileUri);
      } else {
        const testFileUri = getCorrespondingTestFilePath(activeFileUri);
        openNewTab(testFileUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.jumpIndex', async () => {
      const indexFileUris = await getClosestIndexFilePaths();

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

export function deactivate() {}
