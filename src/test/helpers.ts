import * as vscode from 'vscode';
import * as path from 'path';

export const openFileInEditor = async (filename: string) => {
  const sourceUri = vscode.Uri.file(path.join(getWorkspaceAbsolutePath(), filename));
  const document = await vscode.workspace.openTextDocument(sourceUri);
  return vscode.window.showTextDocument(document);
};

const getWorkspaceUri = () => vscode.workspace.workspaceFolders[0].uri;

const getWorkspaceAbsolutePath = () => getWorkspaceUri().fsPath;

export const toAbsolutePath = (...parts: string[]) =>
  vscode.Uri.file(path.join(getWorkspaceAbsolutePath(), ...parts)).fsPath;

export const getEditorAbsolutePath = () => vscode.window.activeTextEditor.document.uri.fsPath;
