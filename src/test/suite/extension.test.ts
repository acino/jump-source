import * as vscode from 'vscode';
import { assert } from 'chai';
import { createSandbox, SinonSpy } from 'sinon';
import { dropRight } from 'lodash';

import { executeCommand, openFileInEditor, deleteFile, deleteFolder } from '../helpers';

// Please note that arrow functions doesn't work with mocha.
describe('Integration tests', function() {
  const sandbox = createSandbox();
  let showErrorMessageSpy: SinonSpy;
  let createQuickPickSpy: SinonSpy;

  beforeEach(function() {
    showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');
    createQuickPickSpy = sandbox.spy(vscode.window, 'createQuickPick');
  });

  afterEach(async function() {
    sandbox.restore();
    await executeCommand('workbench.action.closeAllEditors');
    await executeCommand('notifications.hideToasts');
  });

  describe('jumpTest command', function() {
    it('should open the corresponding test file for the active source file', async function() {
      await openFileInEditor('hasTest.ts');
      await executeCommand('extension.jumpTest');

      assert.isOpenInActiveEditor('tests', 'hasTest.test.ts');
    });

    it('should be able to jump back to the source file', async function() {
      await openFileInEditor('tests', 'hasTest.test.ts');
      await executeCommand('extension.jumpTest');

      assert.isOpenInActiveEditor('hasTest.ts');
    });

    it('should notify the user when the test cannot be found', async function() {
      await openFileInEditor('hasNoTest.ts');
      await executeCommand('extension.jumpTest');

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find test file counterpart`));
    });

    it('should notify the user when the source file cannot be found', async function() {
      await openFileInEditor('tests', 'hasNoSource.test.ts');
      await executeCommand('extension.jumpTest');

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find source file counterpart`));
    });
  });

  describe('jumpIndex command', function() {
    it('should open the index file in the current folder', async function() {
      const currentFolder = 'withSingleIndexFile';
      await openFileInEditor(currentFolder, 'someFile.js');
      await executeCommand('extension.jumpIndex');

      assert.isOpenInActiveEditor(currentFolder, 'index.ts');
    });

    it('should notify the user when there are no index files in the current folder', async function() {
      await openFileInEditor('anyFile.ts');
      await executeCommand('extension.jumpIndex');

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find an index file`));
    });

    it('should notify the user when there are multiple index files in the current folder', async function() {
      await openFileInEditor('withMultipleIndexFiles', 'someFile.js');
      await executeCommand('extension.jumpIndex');

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Found multiple index files`));
    });
  });

  describe('listIndex command', function() {
    it('should show a picker with all index files in the workspace', async function() {
      const expectedQuickPickItems = [
        {
          label: 'withMultipleIndexFiles',
          detail: 'withMultipleIndexFiles\\index.html'
        },
        {
          label: 'withMultipleIndexFiles',
          detail: 'withMultipleIndexFiles\\index.ts'
        },
        {
          label: 'withSingleIndexFile',
          detail: 'withSingleIndexFile\\index.ts'
        }
      ];

      await openFileInEditor('anyFile.ts');
      await executeCommand('extension.listIndex');
      const actualQuickPickItems = createQuickPickSpy.firstCall.returnValue.items;

      assert.isTrue(createQuickPickSpy.calledOnce);
      assert.hasEqualItems(actualQuickPickItems, expectedQuickPickItems);
    });
  });

  describe('createTest command', function() {
    it('should create a test for the current source file', async function() {
      await openFileInEditor('createTest', 'willHaveTest.ts');
      await executeCommand('extension.createTest');
      const testParts = ['createTest', 'tests', 'willHaveTest.test.ts'];

      assert.isOpenInActiveEditor(...testParts);

      deleteFile(...testParts);
      deleteFolder(...dropRight(testParts));
    });

    it('should open the corresponding test if it already exists', async function() {
      await openFileInEditor('hasTest.ts');
      await executeCommand('extension.createTest');

      assert.isOpenInActiveEditor('tests', 'hasTest.test.ts');
    });

    it('should do nothing when the current file is a test', async function() {
      const currentFile = ['tests', 'hasNoSource.test.ts'];
      await openFileInEditor(...currentFile);
      await executeCommand('extension.createTest');

      assert.isOpenInActiveEditor(...currentFile);
    });
  });

  describe('cycleFilename command', function() {
    it('should open a file in the same folder with the same filename except for the extension', async function() {
      const currentFolder = 'withMultipleIndexFiles';
      await openFileInEditor(currentFolder, 'index.ts');
      await executeCommand('extension.cycleFilename');

      assert.isOpenInActiveEditor(currentFolder, 'index.html');
    });

    it('should do nothing when there are no similar files in the current folder', async function() {
      const currentFile = 'anyFile.ts';
      await openFileInEditor(currentFile);
      await executeCommand('extension.cycleFilename');

      assert.isOpenInActiveEditor(currentFile);
    });
  });
});
