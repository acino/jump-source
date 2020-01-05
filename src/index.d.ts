declare module Chai {
  interface Assert {
    isOpenInActiveEditor(...parts: string[]): void;
    hasEqualItems(actual: any[], expected: any): void;
  }
}
