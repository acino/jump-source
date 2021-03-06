import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import { use } from 'chai';
import { isEqual, find } from 'lodash';

import { toAbsolutePath, getEditorAbsolutePath } from '../testHelpers';

use((chai) => {
  chai.assert.isOpenInActiveEditor = (...parts) => {
    const absolutePath = toAbsolutePath(...parts);
    chai.assert.equal(getEditorAbsolutePath(), absolutePath);
  };

  chai.assert.hasEqualItems = (actual, expected) => {
    let hasEqualItems = actual.length === expected.length;
    for (let i = 0; i < actual.length && hasEqualItems; i++) {
      const item = actual[i];
      if (!expected.find((x: any) => isEqual(x, item))) {
        hasEqualItems = false;
      }
    }
    chai.assert.isTrue(hasEqualItems, JSON.stringify({ expected, actual }, null, 2));
  };

  chai.assert.notContainsElementMatching = (actual, partial) => {
    const match = find(actual, partial);
    chai.assert.isUndefined(match, `Found match: ${JSON.stringify(match, null, 2)}`);
  };
});

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'bdd'
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (error) {
        e(error);
      }
    });
  });
}
