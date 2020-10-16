import * as vscode from 'vscode';
import * as path from 'path';
import { unlinkSync, rmdirSync, readdirSync, existsSync } from 'fs';

import { EXTENSION_NAME, Configuration } from '../constants';

export const executeCommand = vscode.commands.executeCommand;

export const openFileInEditor = async (...parts: string[]) => {
  const sourceUri = vscode.Uri.file(path.join(getWorkspaceAbsolutePath(), ...parts));
  const document = await vscode.workspace.openTextDocument(sourceUri);
  return vscode.window.showTextDocument(document);
};

const getWorkspaceUri = () => vscode.workspace.workspaceFolders[0].uri;

const getWorkspaceAbsolutePath = () => getWorkspaceUri().fsPath;

export const toAbsolutePath = (...parts: string[]) =>
  vscode.Uri.file(path.join(getWorkspaceAbsolutePath(), ...parts)).fsPath;

export const getEditorAbsolutePath = () => vscode.window.activeTextEditor?.document.uri.fsPath;

export const deleteFolder = (...parts: string[]) => {
  const folderPath = toAbsolutePath(...parts);
  if (!existsSync(folderPath)) {
    return;
  }
  rmdirSync(folderPath, { recursive: true });
};

export const setWorkspaceConfiguration = (key: Configuration, value: string | boolean) =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).update(key, value);

interface WorkspaceValue {
  [key: string]: string | boolean;
}

export const enforceDefaultConfiguration = async () => {
  const configuration = vscode.workspace.getConfiguration().inspect(EXTENSION_NAME);
  for (const key in configuration.defaultValue as WorkspaceValue) {
    await vscode.workspace.getConfiguration(EXTENSION_NAME).update(key, configuration.defaultValue[key]);
  }
};
