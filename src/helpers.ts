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

export enum PickerDisplay {
  Basename,
  IndexFiles
}

export const isTest = (uri: vscode.Uri) => {
  const re = new RegExp(`\\.${getTestFileSuffix()}\\.(\\w+|\\*)`);
  return re.test(uri.fsPath);
};

export const getCorrespondingSourceFilePath = (testFileUri: vscode.Uri) => {
  const absoluteSourceDir = getParentDir(dirname(testFileUri.fsPath));
  const sourceFilename = removeTestSuffix(basename(testFileUri.fsPath));

  const absolutePath = join(absoluteSourceDir, sourceFilename);
  return vscode.Uri.file(absolutePath);
};

export const getCorrespondingTestFilePath = (sourceFileUri: vscode.Uri, exact = false) => {
  const absoluteTestDir = join(dirname(sourceFileUri.fsPath), getTestSubFolderName());
  const testFilename = addTestSuffix(basename(sourceFileUri.fsPath), exact);

  const absolutePath = join(absoluteTestDir, testFilename);
  return vscode.Uri.file(absolutePath);
};

export const getClosestIndexFilePaths = async (currentFileUri: vscode.Uri) => {
  let absoluteFolderPath = dirname(currentFileUri.fsPath);
  const folderName = basename(absoluteFolderPath);
  if (folderName === getTestSubFolderName()) {
    absoluteFolderPath = getParentDir(absoluteFolderPath);
  }

  const pattern = new vscode.RelativePattern(absoluteFolderPath, 'index.*');

  const absolutePaths = await vscode.workspace.findFiles(pattern).then((files) =>
    files.filter((fileUri) => {
      const filename = basename(fileUri.fsPath);
      return /^index\.[^\.]+$/.test(filename);
    })
  );

  return absolutePaths;
};

export const openNewTab = (fileUri: vscode.Uri) => {
  const errorCallback = () => {
    if (isTest(fileUri)) {
      vscode.window.showErrorMessage(`Couldn't find test file counterpart`);
    } else {
      vscode.window.showErrorMessage(`Couldn't find source file counterpart`);
    }
  };

  if (fileUri.fsPath.endsWith('.*')) {
    pickFromListOfFiles(fileUri, errorCallback);
    return;
  }

  vscode.workspace.openTextDocument(fileUri).then((doc) => vscode.window.showTextDocument(doc), errorCallback);
};

export const createOrOpenInNewTab = (fileUri: vscode.Uri) => {
  const e = new vscode.WorkspaceEdit();
  e.createFile(fileUri, { overwrite: false, ignoreIfExists: true });

  vscode.workspace.applyEdit(e).then(
    () => {
      openNewTab(fileUri);
    },
    () => {
      vscode.window.showErrorMessage(`Failed to create test counterpart`);
    }
  );
};

export const getCurrentAbsolutePath = () =>
  vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : null;

export const getNextFileWithTheSameFilename = async () => {
  const currentFileUri = vscode.window.activeTextEditor.document.uri;
  const currentDirectory = dirname(currentFileUri.fsPath);
  const currentFilename = getFilenameWithoutExtension(currentFileUri.fsPath);

  const fileUris = await findFilesCaseInsensitive(currentDirectory, currentFilename);

  const indexOfCurrentFile = fileUris.findIndex((fileUri) => fileUri.fsPath === currentFileUri.fsPath);
  if (indexOfCurrentFile === -1) {
    return null;
  }
  if (indexOfCurrentFile + 1 >= fileUris.length) {
    return fileUris[0];
  }

  return fileUris[indexOfCurrentFile + 1];
};

export const showPicker = async (display: PickerDisplay, fileUris: vscode.Uri[]) => {
  const quickPick = vscode.window.createQuickPick();
  let { uris, pickerItems } = getPickerItemsFromFiles(display, fileUris);
  quickPick.items = pickerItems;

  quickPick.onDidChangeValue(async (filterValue) => {
    ({ uris, pickerItems } = getPickerItemsFromFiles(display, fileUris, filterValue));
    quickPick.items = pickerItems;
  });

  quickPick.onDidAccept(async () => {
    quickPick.selectedItems.forEach((selectedItem) => {
      const index = pickerItems.findIndex((item) => item === selectedItem);
      if (index !== -1 && uris[index]) {
        openNewTab(uris[index]);
      }
    });
  });

  quickPick.show();
};

const getIndexFileDisplayName = (fileUri: vscode.Uri) =>
  dirname(fileUri.fsPath)
    .split(sep)
    .pop();

const findFilesCaseInsensitive = async (folder: string, filenameWithoutExtension: string) =>
  await vscode.workspace
    .findFiles(new vscode.RelativePattern(folder, '*.*')) // Glob is case sensitive
    .then((files) =>
      files.filter(
        (fileUri) =>
          filenameWithoutExtension.toLowerCase() === getFilenameWithoutExtension(fileUri.fsPath).toLowerCase()
      )
    );

export const getAllIndexFilesInWorkspace = async () => {
  const currentAbsolutePath = getCurrentAbsolutePath();
  return await vscode.workspace.findFiles('**/index.*', getExcludePattern()).then((files) =>
    files
      .filter((fileUri) => fileUri.fsPath !== currentAbsolutePath)
      .filter((fileUri) => {
        const filename = basename(fileUri.fsPath);
        return /^index\.[^\.]+$/.test(filename);
      })
  );
};

const convertToRelative = (fileUri: vscode.Uri) => {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
  return relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
};

const filterByValue = (fileUris: vscode.Uri[], filterValue: string) =>
  isFilterCaseSensitive()
    ? fileUris.filter((fileUri) => {
        const displayName = getIndexFileDisplayName(fileUri);
        let start = 0;
        for (let i = 0; i < filterValue.length; i++) {
          const index = displayName.indexOf(filterValue.charAt(i), start);
          if (index === -1) {
            return false;
          }
          start = index + 1;
        }
        return true;
      })
    : fileUris;

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

const pickFromListOfFiles = async (fileUri: vscode.Uri, errorCallback: () => void) => {
  const folder = dirname(fileUri.fsPath);
  const filenameWithoutExtension = getFilenameWithoutExtension(fileUri.fsPath);

  const fileUris = await findFilesCaseInsensitive(folder, filenameWithoutExtension);

  if (fileUris.length === 0) {
    errorCallback();
    return;
  }
  if (fileUris.length === 1) {
    openNewTab(fileUris[0]);
    return;
  }

  showPicker(PickerDisplay.Basename, fileUris);
};

const getPickerItemsFromFiles = (display: PickerDisplay, fileUris: vscode.Uri[], filterValue = '') => {
  const filteredUris = filterByValue(fileUris, filterValue);

  const pickerItems = filteredUris.map((fileUri) => {
    const quickPickItem: vscode.QuickPickItem = {
      label: display === PickerDisplay.Basename ? basename(fileUri.fsPath) : getIndexFileDisplayName(fileUri),
      detail: convertToRelative(fileUri)
    };
    return quickPickItem;
  });

  return {
    uris: filteredUris,
    pickerItems
  };
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
