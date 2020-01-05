import * as assert from 'assert';
import * as vscode from 'vscode';

import { openFileInEditor, toAbsolutePath, getEditorAbsolutePath } from '../helpers';

describe('Integration tests', () => {
  describe('jumpTest command', () => {
    it('should open the corresponding test file for the active source file', async function() {
      await openFileInEditor('hasTest.ts');
      await vscode.commands.executeCommand('extension.jumpTest');

      const testPath = toAbsolutePath('tests', 'hasTest.test.ts');
      assert.equal(getEditorAbsolutePath(), testPath);
    });
  });
});
