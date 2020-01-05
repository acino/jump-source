import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';
import { use } from 'chai';
import { isEqual } from 'lodash';

import { toAbsolutePath, getEditorAbsolutePath } from '../helpers';

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
    chai.assert.isTrue(hasEqualItems);
  };
});

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'bdd'
  });
  mocha.useColors(true);

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
      } catch (err) {
        e(err);
      }
    });
  });
}
