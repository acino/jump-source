import * as vscode from "vscode";
import { dirname, basename, join, sep, relative } from "path";

const EXTENSION_NAME = "jumpSource";
const CONF_TEST_FILE_SUFFIX = "testFileSuffix";
const CONF_TEST_SUB_FOLDER = "testSubFolder";
const CONF_FILTER_CASE_SENSITIVE = "filterCaseSensitive";
const CONF_EXCLUDE_PATTERN = "excludePattern";

export type RelativePath = {
  relativeRoot: string;
  displayName: string;
};

export const isTest = (path: string) => {
  const re = new RegExp(`\\.${getTestFileSuffix()}\\.\\w+`);
  return re.test(path);
};

export const getCorrespondingSourceFilePath = (testFilePath: string) => {
  const sourceDir = getParentDir(dirname(testFilePath));
  const sourceFilename = removeTestSuffix(basename(testFilePath));

  return join(sourceDir, sourceFilename);
};

export const getCorrespondingTestFilePath = (sourceFilePath: string) => {
  const testDir = join(dirname(sourceFilePath), getTestSubFolderName());
  const testFilename = addTestSuffix(basename(sourceFilePath));

  return join(testDir, testFilename);
};

export const getClosestIndexFilePaths = async (currentFilePath: string) => {
  let dirPath = dirname(currentFilePath);
  const nameOfDir = basename(dirPath);
  if (nameOfDir === getTestSubFolderName()) {
    dirPath = getParentDir(dirPath);
  }

  const pattern = new vscode.RelativePattern(dirPath, "index.*");

  const absolutePaths = await vscode.workspace.findFiles(pattern).then(files =>
    files
      .map(file => file.fsPath)
      .filter(absolutePath => {
        const filename = basename(absolutePath);
        return /^index\.[^\.]+$/.test(filename);
      })
  );

  return absolutePaths;
};

export const openNewTab = (filePath: string) => {
  vscode.workspace.openTextDocument(filePath).then(
    doc => vscode.window.showTextDocument(doc),
    () => {
      if (isTest(filePath)) {
        vscode.window.showErrorMessage(`Couldn't find test file counterpart`);
      } else {
        vscode.window.showErrorMessage(`Couldn't find source file counterpart`);
      }
    }
  );
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

export const getIndexFileDisplayName = (indexFilePath: string) =>
  dirname(indexFilePath)
    .split(sep)
    .pop();

export const getCurrentAbsolutePath = () =>
  vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.uri.fsPath
    : null;

export const getListOfIndexFiles = async (
  filterValue = ""
): Promise<vscode.QuickPickItem[]> => {
  const indexFiles = await getAllIndexFilesInWorkspace();
  let relativePaths = convertToRelative(indexFiles);
  relativePaths = filterByValue(relativePaths, filterValue);
  return relativePaths.map(({ relativeRoot, displayName }) => {
    const quickPickItem: vscode.QuickPickItem = {
      label: displayName,
      detail: relativeRoot
    };
    return quickPickItem;
  });
};

export const relativeRootToAbsolute = (relativePath: string) =>
  join(vscode.workspace.rootPath, relativePath);

const getAllIndexFilesInWorkspace = async () => {
  const currentFile = getCurrentAbsolutePath();
  return await vscode.workspace
    .findFiles("**/index.*", getExcludePattern())
    .then(files =>
      files
        .map(file => file.fsPath)
        .filter(absolutePath => absolutePath !== currentFile)
        .filter(absolutePath => {
          const filename = basename(absolutePath);
          return /^index\.[^\.]+$/.test(filename);
        })
    );
};

const convertToRelative = (paths: string[]): RelativePath[] => {
  const rootPath = vscode.workspace.rootPath;
  return paths.map(absolutePath => {
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
    ? relativePaths.filter(relativePath => {
        let start = 0;
        for (let i = 0; i < filterValue.length; i++) {
          const index = relativePath.displayName.indexOf(
            filterValue.charAt(i),
            start
          );
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
  const sourceFilenameParts = sourceFilename.split(".");
  const extension = sourceFilenameParts.pop();
  sourceFilenameParts.pop();
  sourceFilenameParts.push(extension);

  return sourceFilenameParts.join(".");
};

const addTestSuffix = (testFilename: string) => {
  const testFilenameParts = testFilename.split(".");
  const extension = testFilenameParts.pop();
  testFilenameParts.push(getTestFileSuffix());
  testFilenameParts.push(extension);

  return testFilenameParts.join(".");
};

const getTestFileSuffix = (): string =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_TEST_FILE_SUFFIX);

const getTestSubFolderName = (): string =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_TEST_SUB_FOLDER);

const isFilterCaseSensitive = (): boolean =>
  vscode.workspace
    .getConfiguration(EXTENSION_NAME)
    .get(CONF_FILTER_CASE_SENSITIVE);

const getExcludePattern = (): string =>
  vscode.workspace.getConfiguration(EXTENSION_NAME).get(CONF_EXCLUDE_PATTERN) ||
  null;
