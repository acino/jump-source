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
  getAllIndexFilesInWorkspace
} from './helpers';
import { Command, PickerDisplay } from './constants';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(Command.JumpTest, () => {
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
    vscode.commands.registerCommand(Command.JumpIndex, async () => {
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
    vscode.commands.registerCommand(Command.ListIndex, async () => {
      const fileUris = await getAllIndexFilesInWorkspace();
      showPicker(PickerDisplay.IndexFiles, fileUris);
      return Promise.resolve();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Command.CreateTest, async () => {
      const activeFileUri = vscode.window.activeTextEditor.document.uri;

      if (!isTest(activeFileUri)) {
        const testFileUri = getCorrespondingTestFilePath(activeFileUri, true);
        return createOrOpenInNewTab(testFileUri);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Command.CycleFilename, async () => {
      const nextFileUri = await getNextFileWithTheSameFilename();
      if (!nextFileUri) {
        return Promise.resolve();
      }
      return openNewTab(nextFileUri);
    })
  );
}

export function deactivate() {}
