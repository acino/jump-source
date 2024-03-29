export const EXTENSION_NAME = 'jumpSource';

export enum Configuration {
  TestFileSuffix = 'testFileSuffix',
  TestSubFolder = 'testSubFolder',
  RelativeRoots = 'relativeRoots',
  MatchExtension = 'matchExtension',
  FilterCaseSensitive = 'filterCaseSensitive',
  ExcludePattern = 'excludePattern',
  TestFileExtension = 'testFileExtension'
}

export enum TestFileExtension {
  SameAsSource = 'sameAsSource'
}

export enum Command {
  JumpTest = 'extension.jumpTest',
  JumpIndex = 'extension.jumpIndex',
  ListIndex = 'extension.listIndex',
  CreateTest = 'extension.createTest',
  CycleFilename = 'extension.cycleFilename'
}

export type RelativePath = {
  relativeRoot: string;
  displayName: string;
};

export enum PickerDisplay {
  Basename,
  IndexFiles
}
