import * as vscode from "vscode";
import { dirname, basename, join, sep } from "path";

const EXTENSION_NAME = "jumpSource";
const CONF_TEST_FILE_SUFFIX = "testFileSuffix";
const CONF_TEST_SUB_FOLDER = "testSubFolder";

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
