import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

describe('Integration tests', () => {
  before(() => {
    vscode.window.showInformationMessage('Running tests...');
  });

  it('should open the corresponding test file for the active source file', async function(done) {
    this.timeout(15000);
    const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
    const sourceUri = vscode.Uri.file(path.join(workspaceUri.fsPath, 'hasTest.ts'));
    const document = await vscode.workspace.openTextDocument(sourceUri);
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand('extension.jumpTest');

    setTimeout(() => {
      const testUri = vscode.Uri.file(path.join(workspaceUri.fsPath, 'tests', 'hasTest.test.ts'));
      assert.equal(vscode.window.activeTextEditor.document.uri.fsPath, testUri.fsPath);
      done();
    }, 5000);
  });
});
