import * as vscode from 'vscode';
import { sep } from 'path';
import { assert } from 'chai';
import { createSandbox, SinonSpy } from 'sinon';
import { dropRight } from 'lodash';

import {
  executeCommand,
  openFileInEditor,
  deleteFolder,
  setWorkspaceConfiguration,
  enforceDefaultConfiguration
} from '../testHelpers';
import { Configuration, Command } from '../../constants';

// Please note that arrow functions doesn't work with mocha.
describe('Integration tests', function () {
  const sandbox = createSandbox();
  let showErrorMessageSpy: SinonSpy;
  let createQuickPickSpy: SinonSpy;

  beforeEach(async function () {
    this.timeout(10000);
    showErrorMessageSpy = sandbox.spy(vscode.window, 'showErrorMessage');
    createQuickPickSpy = sandbox.spy(vscode.window, 'createQuickPick');
    await enforceDefaultConfiguration();
  });

  afterEach(async function () {
    this.timeout(10000);
    sandbox.restore();
    await executeCommand('workbench.action.closeAllEditors');
    await executeCommand('notifications.hideToasts');
  });

  describe('jumpTest command', function () {
    it('should open the corresponding test file for the active source file', async function () {
      await openFileInEditor('hasTest.ts');
      await executeCommand(Command.JumpTest);

      assert.isOpenInActiveEditor('tests', 'hasTest.test.ts');
    });

    it('should be able to jump back to the source file', async function () {
      await openFileInEditor('tests', 'hasTest.test.ts');
      await executeCommand(Command.JumpTest);

      assert.isOpenInActiveEditor('hasTest.ts');
    });

    it('should notify the user when the test cannot be found', async function () {
      await openFileInEditor('hasNoTest.ts');
      await executeCommand(Command.JumpTest);

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find test file counterpart`));
    });

    it('should notify the user when the source file cannot be found', async function () {
      await openFileInEditor('tests', 'hasNoSource.test.ts');
      await executeCommand(Command.JumpTest);

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find source file counterpart`));
    });

    it('should be possible to configure another test suffix', async function () {
      await setWorkspaceConfiguration(Configuration.TestFileSuffix, 'spec');
      await openFileInEditor('withSpecialSuffix.js');
      await executeCommand(Command.JumpTest);

      assert.isOpenInActiveEditor('tests', 'withSpecialSuffix.spec.js');
    });

    it('should be possible to configure another test folder', async function () {
      const currentFolder = 'withSpecialTestFolder';
      const testFolder = 'spec';
      await setWorkspaceConfiguration(Configuration.TestSubFolder, testFolder);
      await openFileInEditor(currentFolder, 'hasTest.js');
      await executeCommand(Command.JumpTest);

      assert.isOpenInActiveEditor(currentFolder, testFolder, 'hasTest.test.js');
    });

    it('should be possible to configure that the test file to have a different extension', async function () {
      const expectedQuickPickItems = [
        { label: 'hasTest.js', detail: 'hasTest.js' },
        { label: 'hasTest.ts', detail: 'hasTest.ts' }
      ];

      await setWorkspaceConfiguration(Configuration.MatchExtension, false);
      await openFileInEditor('tests', 'hasTest.test.ts');
      await executeCommand(Command.JumpTest);

      const actualQuickPickItems = createQuickPickSpy.firstCall.returnValue.items;

      assert.isTrue(createQuickPickSpy.calledOnce);
      assert.hasEqualItems(actualQuickPickItems, expectedQuickPickItems);
    });
  });

  describe('jumpIndex command', function () {
    it('should open the index file in the current folder', async function () {
      const currentFolder = 'withSingleIndexFile';
      await openFileInEditor(currentFolder, 'someFile.js');
      await executeCommand(Command.JumpIndex);

      assert.isOpenInActiveEditor(currentFolder, 'index.ts');
    });

    it('should notify the user when there are no index files in the current folder', async function () {
      await openFileInEditor('anyFile.ts');
      await executeCommand(Command.JumpIndex);

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Couldn't find an index file`));
    });

    it('should notify the user when there are multiple index files in the current folder', async function () {
      await openFileInEditor('withMultipleIndexFiles', 'someFile.js');
      await executeCommand(Command.JumpIndex);

      assert.isTrue(showErrorMessageSpy.calledOnceWith(`Found multiple index files`));
    });
  });

  describe('listIndex command', function () {
    it('should show a picker with all index files in the workspace', async function () {
      const expectedQuickPickItems = [
        {
          label: 'camelCase',
          detail: `camelCase${sep}index.tsx`
        },
        {
          label: 'UpperCamelCase',
          detail: `UpperCamelCase${sep}index.tsx`
        },
        {
          label: 'withMultipleIndexFiles',
          detail: `withMultipleIndexFiles${sep}index.html`
        },
        {
          label: 'withMultipleIndexFiles',
          detail: `withMultipleIndexFiles${sep}index.ts`
        },
        {
          label: 'withSingleIndexFile',
          detail: `withSingleIndexFile${sep}index.ts`
        }
      ];

      await openFileInEditor('anyFile.ts');
      await executeCommand(Command.ListIndex);

      const actualQuickPickItems = createQuickPickSpy.firstCall.returnValue.items;

      assert.hasEqualItems(actualQuickPickItems, expectedQuickPickItems);
    });

    it('should sort folders with matching case higher when in case insensitive mode', async function () {
      const expectedQuickPickItems = [
        {
          label: 'UpperCamelCase',
          detail: `UpperCamelCase${sep}index.tsx`
        },
        {
          label: 'camelCase',
          detail: `camelCase${sep}index.tsx`
        }
      ];

      await setWorkspaceConfiguration(Configuration.FilterCaseSensitive, false);

      const onDidChangeValue = sandbox.stub();
      createQuickPickSpy.restore();
      sandbox
        .stub(vscode.window, 'createQuickPick')
        .returns({ onDidChangeValue, onDidAccept: () => {}, show: () => {} } as any);

      await openFileInEditor('anyFile.ts');
      await executeCommand(Command.ListIndex);
      const changeValueCallback: (value: string) => any[] = onDidChangeValue.lastCall.args[0];
      const actualQuickPickItems = changeValueCallback('CC');

      assert.hasEqualItems(actualQuickPickItems, expectedQuickPickItems);
    });

    it('should be possible to exclude folders from the search', async function () {
      await setWorkspaceConfiguration(Configuration.ExcludePattern, 'withSingleIndexFile/**.*');
      await openFileInEditor('anyFile.ts');
      await executeCommand(Command.ListIndex);
      const actualQuickPickItems = createQuickPickSpy.firstCall.returnValue.items;

      assert.notContainsElementMatching(actualQuickPickItems, { label: 'withSingleIndexFile' });
    });
  });

  describe('createTest command', function () {
    it('should create a test for the current source file', async function () {
      const currentFolder = 'createTest';
      await openFileInEditor(currentFolder, 'willHaveTest.ts');
      await executeCommand(Command.CreateTest);
      const testParts = [currentFolder, 'tests', 'willHaveTest.test.ts'];

      assert.isOpenInActiveEditor(...testParts);

      deleteFolder(...dropRight(testParts));
    });

    it('should open the corresponding test if it already exists', async function () {
      await openFileInEditor('hasTest.ts');
      await executeCommand(Command.CreateTest);

      assert.isOpenInActiveEditor('tests', 'hasTest.test.ts');
    });

    it('should do nothing when the current file is a test', async function () {
      const currentFile = ['tests', 'hasNoSource.test.ts'];
      await openFileInEditor(...currentFile);
      await executeCommand(Command.CreateTest);

      assert.isOpenInActiveEditor(...currentFile);
    });

    it('should be possible to configure the extension of the test file that will be created', async function () {
      await setWorkspaceConfiguration(Configuration.MatchExtension, false);
      await setWorkspaceConfiguration(Configuration.TestFileExtension, 'js');
      const currentFolder = 'createTest';
      await openFileInEditor(currentFolder, 'willHaveTest.ts');
      await executeCommand(Command.CreateTest);
      const testParts = [currentFolder, 'tests', 'willHaveTest.test.js'];

      assert.isOpenInActiveEditor(...testParts);

      deleteFolder(...dropRight(testParts));
    });

    it('should use the same extension for tests by default', async function () {
      await setWorkspaceConfiguration(Configuration.MatchExtension, false);
      const currentFolder = 'createTest';
      await openFileInEditor(currentFolder, 'willHaveTest.ts');
      await executeCommand(Command.CreateTest);
      const testParts = [currentFolder, 'tests', 'willHaveTest.test.ts'];

      assert.isOpenInActiveEditor(...testParts);

      deleteFolder(...dropRight(testParts));
    });
  });

  describe('cycleFilename command', function () {
    it('should open a file in the same folder with the same filename except for the extension', async function () {
      const currentFolder = 'withMultipleIndexFiles';
      await openFileInEditor(currentFolder, 'index.ts');
      await executeCommand(Command.CycleFilename);

      assert.isOpenInActiveEditor(currentFolder, 'index.html');
    });

    it('should do nothing when there are no similar files in the current folder', async function () {
      const currentFile = 'anyFile.ts';
      await openFileInEditor(currentFile);
      await executeCommand(Command.CycleFilename);

      assert.isOpenInActiveEditor(currentFile);
    });

    it('should be possible to configure the search to be case insensitive', async function () {
      await setWorkspaceConfiguration(Configuration.FilterCaseSensitive, false);
      const currentFolder = 'withSimilarFiles';
      await openFileInEditor(currentFolder, 'someFile.scss');
      await executeCommand(Command.CycleFilename);

      assert.isOpenInActiveEditor(currentFolder, 'SomeFile.vue');
    });
  });
});
