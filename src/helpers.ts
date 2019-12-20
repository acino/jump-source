import * as vscode from 'vscode';
import { dirname, basename, join, sep, relative } from 'path';

const EXTENSION_NAME = 'jumpSource';
const CONF_TEST_FILE_SUFFIX = 'testFileSuffix';
const CONF_TEST_SUB_FOLDER = 'testSubFolder';
const CONF_MATCH_EXTENSION = 'matchExtension';
const CONF_FILTER_CASE_SENSITIVE = 'filterCaseSensitive';
const CONF_EXCLUDE_PATTERN = 'excludePattern';
const CONF_TEST_FILE_EXTENSION = 'testFileExtension';
const SAME_AS_SOURCE = 'sameAsSource';

export type RelativePath = {
  relativeRoot: string;
  displayName: string;
};

export const isTest = (path: string) => {
  const re = new RegExp(`\\.${getTestFileSuffix()}\\.(\\w+|\\*)`);
  return re.test(path);
};

export const getCorrespondingSourceFilePath = (testFilePath: string) => {
  const sourceDir = getParentDir(dirname(testFilePath));
  const sourceFilename = removeTestSuffix(basename(testFilePath));

  return join(sourceDir, sourceFilename);
};

export const getCorrespondingTestFilePath = (sourceFilePath: string, exact = false) => {
  const testDir = join(dirname(sourceFilePath), getTestSubFolderName());
  const testFilename = addTestSuffix(basename(sourceFilePath), exact);

  return join(testDir, testFilename);
};

export const getClosestIndexFilePaths = async (currentFilePath: string) => {
  let dirPath = dirname(currentFilePath);
  const nameOfDir = basename(dirPath);
  if (nameOfDir === getTestSubFolderName()) {
    dirPath = getParentDir(dirPath);
  }

  const pattern = new vscode.RelativePattern(dirPath, 'index.*');

  const absolutePaths = await vscode.workspace.findFiles(pattern).then((files) =>
    files
      .map((file) => file.fsPath)
      .filter((absolutePath) => {
        const filename = basename(absolutePath);
        return /^index\.[^\.]+$/.test(filename);
      })
  );

  return absolutePaths;
};

export const openNewTab = (filePath: string) => {
  const errorCallback = () => {
    if (isTest(filePath)) {
      vscode.window.showErrorMessage(`Couldn't find test file counterpart`);
    } else {
      vscode.window.showErrorMessage(`Couldn't find source file counterpart`);
    }
  };

  if (filePath.endsWith('.*')) {
    pickFromListOfFiles(filePath, errorCallback);
    return;
  }

  vscode.workspace.openTextDocument(filePath).then((doc) => vscode.window.showTextDocument(doc), errorCallback);
};

export const createOrOpenInNewTab = (filePath: string) => {
  const e = new vscode.WorkspaceEdit();
  const uri = vscode.Uri.file(filePath);
  e.createFile(uri, { overwrite: false, ignoreIfExists: true });

  vscode.workspace.applyEdit(e).then(
    () => {
      openNewTab(filePath);
    },
    () => {
      vscode.window.showErrorMessage(`Failed to create test counterpart`);
    }
  );
};

export const getCurrentAbsolutePath = () =>
  vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : null;

export const getNextFileWithTheSameFilename = async (relativePath: string) => {
  const currentFile = getCurrentAbsolutePath();
  const currentDirectory = dirname(relativePath);
  const currentFilename = getFilenameWithoutExtension(relativePath);

  const paths = await findFilesCaseInsensitive(currentDirectory, currentFilename);

  const indexOfCurrentFile = paths.findIndex((path) => path === currentFile);
  if (indexOfCurrentFile === -1) {
    return null;
  }
  if (indexOfCurrentFile + 1 >= paths.length) {
    return paths[0];
  }

  return paths[indexOfCurrentFile + 1];
};

export const showPicker = async (absolutePaths: string[]) => {
  const quickPick = vscode.window.createQuickPick();
  quickPick.items = getPickerItemsFromFiles(absolutePaths);

  quickPick.onDidChangeValue(async (filterValue) => {
    quickPick.items = getPickerItemsFromFiles(absolutePaths, filterValue);
  });

  quickPick.onDidAccept(async () => {
    quickPick.selectedItems.forEach((selectedItem) => {
      openNewTab(relativeRootToAbsolute(selectedItem.detail));
    });
  });

  quickPick.show();
};

const relativeRootToAbsolute = (relativePath: string) => {
  const x = vscode.workspace.workspaceFolders;
  return join(vscode.workspace.rootPath, relativePath);
};

const getIndexFileDisplayName = (indexFilePath: string) =>
  dirname(indexFilePath)
    .split(sep)
    .pop();

const findFilesCaseInsensitive = async (folder: string, filenameWithoutExtension: string) =>
  await vscode.workspace
    .findFiles(new vscode.RelativePattern(folder, '*.*')) // Glob is case sensitive
    .then((files) =>
      files
        .map((file) => file.fsPath)
        .filter((path) => filenameWithoutExtension.toLowerCase() === getFilenameWithoutExtension(path).toLowerCase())
    );

export const getAllIndexFilesInWorkspace = async () => {
  const currentFile = getCurrentAbsolutePath();
  return await vscode.workspace.findFiles('**/index.*', getExcludePattern()).then((files) =>
    files
      .map((file) => file.fsPath)
      .filter((absolutePath) => absolutePath !== currentFile)
      .filter((absolutePath) => {
        const filename = basename(absolutePath);
        return /^index\.[^\.]+$/.test(filename);
      })
  );
};

const convertToRelative = (paths: string[]): RelativePath[] => {
  const rootPath = vscode.workspace.rootPath;
  return paths.map((absolutePath) => {
    const relativeRoot = relative(rootPath, absolutePath);
    const displayName = getIndexFileDisplayName(relativeRoot);
    return {
      relativeRoot,
      displayName
    };
  });
};

const filterByValue = (relativePaths: RelativePath[], filterValue: string) =>
  isFilterCaseSensitive()
    ? relativePaths.filter((relativePath) => {
        let start = 0;
        for (let i = 0; i < filterValue.length; i++) {
          const index = relativePath.displayName.indexOf(filterValue.charAt(i), start);
          if (index === -1) {
            return false;
          }
          start = index + 1;
        }
        return true;
      })
    : relativePaths;

const getParentDir = (dirPath: string) => {
  const subFolderName = getTestSubFolderName();
  if (!subFolderName) {
    return dirPath;
  }

  const sourceDirParts = dirPath.split(sep);
  sourceDirParts.pop();
  return sourceDirParts.join(sep);
};

const removeTestSuffix = (sourceFilename: string) => {
  const sourceFilenameParts = sourceFilename.split('.');
  const extension = sourceFilenameParts.pop();
  sourceFilenameParts.pop();

  if (hasToMatchExtension()) {
    sourceFilenameParts.push(extension);
  } else {
    sourceFilenameParts.push('*');
  }

  return sourceFilenameParts.join('.');
};

const addTestSuffix = (testFilename: string, exact: boolean) => {
  const testFilenameParts = testFilename.split('.');
  const extension = testFilenameParts.pop();
  testFilenameParts.push(getTestFileSuffix());

  if (hasToMatchExtension()) {
    testFilenameParts.push(extension);
  } else if (exact) {
    const extensionSetting = getTestFileExtension();
    if (extensionSetting === SAME_AS_SOURCE) {
      testFilenameParts.push(extension);
    } else {
      testFilenameParts.push(extensionSetting);
    }
  } else {
    testFilenameParts.push('*');
  }

  return testFilenameParts.join('.');
};

const getFilenameWithoutExtension = (path: string) => {
  const filename = basename(path);
  const parts = filename.split('.');
  parts.pop();
  return parts.join('.');
};

const pickFromListOfFiles = async (filePath: string, errorCallback: () => void) => {
  const folder = dirname(filePath);
  const filenameWithoutExtension = getFilenameWithoutExtension(filePath);

  const paths = await findFilesCaseInsensitive(folder, filenameWithoutExtension);

  if (paths.length === 0) {
    errorCallback();
    return;
  }
  if (paths.length === 1) {
    openNewTab(paths[0]);
    return;
  }

  showPicker(paths);
};

const getPickerItemsFromFiles = (absolutePaths: string[], filterValue = '') => {
  let relativePaths = convertToRelative(absolutePaths);
  relativePaths = filterByValue(relativePaths, filterValue);
  return relativePaths.map(({ relativeRoot, displayName }) => {
    const quickPickItem: vscode.QuickPickItem = {
      label: displayName,
      detail: relativeRoot
    };
    return quickPickItem;
  });
};

const getTestFileSuffix = (): string => vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_TEST_FILE_SUFFIX);

const getTestSubFolderName = (): string => vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_TEST_SUB_FOLDER);

const hasToMatchExtension = (): boolean => vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_MATCH_EXTENSION);

const isFilterCaseSensitive = (): boolean =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_FILTER_CASE_SENSITIVE);

const getExcludePattern = (): string =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_EXCLUDE_PATTERN) || null;

const getTestFileExtension = (): string =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_TEST_FILE_EXTENSION);
