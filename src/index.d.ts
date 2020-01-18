declare module Chai {
  interface Assert {
    isOpenInActiveEditor(...parts: string[]): void;
    hasEqualItems(actual: any[], expected: any): void;
    notContainsElementMatching(actual: any[], partial: any): void;
  }
}
