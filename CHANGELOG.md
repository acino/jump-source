# Change log

All notable changes to the "jump-source" extension will be documented in this file.

### 1.4.4.

README fixes.

### 1.4.3.

Adds support for finding tests in a directory structure which mirrors the directory structure of the code. See the `relativeRoots` setting. https://github.com/acino/jump-source/issues/6

### 1.4.2.

Fixes bug where the wrong file was opened when listing index files.

### 1.4.1

Fixes sorting of quick pickers.

#### Chore

- Migrates from TSLint to ESLint.
- Updates dependencies.

### 1.4.0

Bug fixes and adjusts semantic versioning. Adds integration tests.

## 1.3.3

Adds setting for test file extension for cases where the source file and test file have different file extensions.

## 1.3.2

Adds setting for loose matching of source file and test file. It's now possible to ignore differences in file extension.

## 1.3.1

Adds support for cycling through files with the same filename in the current folder.

## 1.3.0

Adds support for creating a test file for the currently active source file.

## 1.2.1

Fixes issue with opening index file from quick pick.

## 1.2.0

Adds support for listing all index files in the workspace with filtering capabilities.

## 1.1.1

Performance fix for jump to index file.

## 1.1.0

Adds support for jumping to the closest index file.

## 1.0.1

Adds logo and keywords.

## 1.0.0

Supports switching to the corresponding test for a source file and back again using the jumpSource command or with a keyboard shortcut.
