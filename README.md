# jump-source for VS Code

This extension adds multiple shortcuts for quickly jumping between source files and test files.

It enables you to:

- Quickly switch to the corresponding test file for a source file and vice versa.
- Go to the closest index source file.
- List all index files in the workspace.

## Features

This extension assumes that tests have the same name as the source file but with a suffix. It also assumes that the test file is located in the same folder as the source file, or in a subfolder with a known name.

The source file can have any file extension as long as the test file has the same file extension.

Example:

`someSourceFile.tsx`

`/tests/someSourceFile.test.tsx`

## Extension Settings

This extension contributes the following settings:

- `jumpSource.testFileSuffix`: Suffix to append to source file name before the file extension (default: test).
- `jumpSource.testSubFolder`: Name of sub folder containing tests (default: tests).
- `jumpSource.filterCaseSensitive`: Used when index files are listed. When set to true the filter will exclude results with the wrong case (default: true).
- `jumpSource.excludePattern`: Used when index files are listed. This glob pattern is ignored in the file search.

Set `jumpSource.testSubFolder` to empty string if your tests reside within the same folder as your source files.

## Usage

### Jumping between source file and test file

1. Open a source file that has a corresponding test file, or a test file.
2. Open the command palette with Ctrl + Shift + P and choose the Jump to/from test command. You may also use the keyboard shortcut Ctrl + O T.

### Jumping to the closest index file

1. Open a source file och test file.
2. Open the command palette with Ctrl + Shift + P and choose the Jump to index file command. You may also use the keyboard shortcut Ctrl + O I.

The extension will jump to the index file of the current folder. If the active file is in the test sub folder it will jump to the index file in the parent folder.

### List all index files in the workspace

1. Open the command palette with Ctrl + Shift + P and choose the List index files command. You may also use the keyboard shortcut Ctrl + O L.
2. Pick a file or filter by entering a partial folder name.

When in case sensitive mode items with the wrong case will be removed from the suggestions. However since the VS Code API doesn't allow to fully control the filter the character highlighting might not highlight as expected.

Remember to review the exclude pattern setting to speed up the search for your particular project.

## Release Notes

Releases of jumpSource for VS Code.

### 1.2.1

Fixes issue with opening index file from quick pick.

### 1.2.0

Adds support for listing all index files in the workspace with filtering capabilities.

### 1.1.1

Performance fix for jump to index file.

### 1.1.0

Adds support for jumping to the closest index file.

### 1.0.1

Adds logo and keywords.

### 1.0.0

Supports switching to the corresponding test for a source file and back again using the jumpSource command or with a keyboard shortcut.
