import * as vscode from 'vscode';
import * as path from 'path';
import { unlinkSync, rmdirSync } from 'fs';

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

export const deleteFile = (...parts: string[]) => unlinkSync(toAbsolutePath(...parts));

export const deleteFolder = (...parts: string[]) => rmdirSync(toAbsolutePath(...parts));
