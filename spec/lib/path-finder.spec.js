var lodash = require('lodash');
var mock = require('mock-require');

const testFileData = {
  'path/t1.spec.js':'describe(\'s1\', function() { it(\'d1\', function() {}); });',
  'path/t2.spec.js':'describe(\'s2\', function() { it(\'d2\', function() {}); });',
  'path/t3.spec.js':'describe(\'s3\', function() { ' +
    'it(\'d3.1\', function() {}); }); it(\'d3.2\', function() {}); });',
  'path/t4.spec.js':'describe(\'\\\'s4\\\'\', function() { it(\'\\\'d4\\\'\', function() {}); });',
  'path/t5.spec.js':'describe(\'\\\"s5\\\"\', function() { it(\'\\\"d5\\\"\', function() {}); });',
  'path/t6.spec.js':'describe(\'s6\"\\\\\'\\\\\'\"\', function() { it(\'d6\"\\\\\'\\\\\'\"\', function() {}); });',
  'path/t7.spec.js':'describe(\'s7\', function() { it(\'d7.1\', function() {}); });' +
    'describe(\'s7.2\', function() { it(\'d7.2\', function() {}); });' +
    'describe(\'s7.3\', function() { it(\'d7.3\', function() {}); });' +
    'describe(\'s7.4\', function() { describe(\'s7.4.1\'+\'text\', function() { ' +
      'it(\'d7.4.1\'+\'text\', function() {}); }); });',
  'path/t8.spec.js': 'describe.skip(\'s8\', function() { it.skip(\'d8\', function() {}); });',
  'path/t9.spec.js':'describe(\'s9\', function() { xit(\'d9.1\', function() {}); });' +
    'describe(\'s9.2\', function() { it.skip(\'d9.2\', function() {}); });' +
    'describe(\'s9.3\', function() { xit(\'d9.3\', function() {}); });' +
    'describe(\'s9.4\', function() { describe.skip(\'s9.4.1\'+\'text\', function() { ' +
    'fit(\'d9.4.1\'+\'text\', function() {}); }); });',
}

const parsedTestFiles = {
  'path/t1.spec.js': { describe: ['s1'], it: ['d1']},
  'path/t2.spec.js': { describe: ['s2'], it: ['d2']},
  'path/t3.spec.js': { describe: ['s3'], it: ['d3.1', 'd3.2']},
  'path/t4.spec.js': { describe: ['\\\'s4\\\''], it: ['\\\'d4\\\'']},
  'path/t5.spec.js': { describe: ['\\\"s5\\\"'], it: ['\\\"d5\\\"']},
  'path/t6.spec.js': { describe: ['s6\"\\\\\'\\\\\'\"'], it: ['d6\"\\\\\'\\\\\'\"']},
  'path/t7.spec.js': { describe: ['s7', 's7.2', 's7.3', 's7.4', 's7.4.1'],
     it: ['d7.1', 'd7.2', 'd7.3', 'd7.4.1']},
  'path/t8.spec.js': { describe: ['s8'], it: ['d8'] },
  'path/t9.spec.js': { describe: ['s9', 's9.2', 's9.3', 's9.4', 's9.4.1'],
      it: ['d9.1', 'd9.2', 'd9.3', 'd9.4.1'],
  }
}

describe('Path finder tests', function() {
  var pathFinder;

  beforeAll(function() {

    mock('fs', {
      readFileSync: function(path, encoding) {
        return testFileData[path];
      }
    });

    mock('glob', {
      sync: function(pattern) {
        return Object.keys(testFileData);
      }
    });

    mock('../../lib/custom-logger', {
      init: function (level) {
        return { error: (message) => {} };
      }
    });

    pathFinder = mock.reRequire('../../lib/path-finder');
  });

  afterAll(function() {
    mock.stop('../../lib/custom-logger');
    mock.stop('glob');
    mock.stop('fs');
  });

  describe('Parsing test files', function() {
    describe('Test files with single test cases', function() {
      it('Parsed test paths matched expected test paths', function() {
        expect(lodash.isEqual(pathFinder.parseTestFiles(
          '**/*.spec.ts', 'utf-8'), parsedTestFiles)).toBe(true);
      });

      it('1st test file match suite 1 and description 1', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t1.spec.js'];
        expect(path.describe[0]).toBe('s1');
        expect(path.it[0]).toBe('d1');
      });

      it('2sd test file match suite 2 and description 2', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t2.spec.js'];
        expect(path.describe[0]).toBe('s2');
        expect(path.it[0]).toBe('d2');
      });

      it('3rd test file match suite 3 and description 3.1 and 3.2', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t3.spec.js'];
        expect(path.describe[0]).toBe('s3');
        expect(path.it[0]).toBe('d3.1');
        expect(path.it[1]).toBe('d3.2');
      });

      it("8st test file match suite 8 and description 8 with skipped suite and test", function() {
        var paths = pathFinder.parseTestFiles("**/*.spec.ts", "utf-8");
        var path = paths["path/t8.spec.js"];
        expect(path.describe[0]).toBe("s8");
        expect(path.it[0]).toBe("d8");
      });

      describe('Test cases with quoted text', function() {
        it('4rd test file match suite and description with single quotes', function() {
          var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
          var path = paths['path/t4.spec.js'];
          expect(path.describe[0]).toBe('\\\'s4\\\'');
          expect(path.it[0]).toBe('\\\'d4\\\'');
        });

        it('5th test file match suite and description with double quotes', function() {
          var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
          var path = paths['path/t5.spec.js'];
          expect(path.describe[0]).toBe('\\\"s5\\\"');
          expect(path.it[0]).toBe('\\\"d5\\\"');
        });

        it('6th test file match suite and description with mixed single and double quotes', function() {
          var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
          var path = paths['path/t6.spec.js'];
          expect(path.describe[0]).toBe('s6\"\\\\\'\\\\\'\"');
          expect(path.it[0]).toBe('d6\"\\\\\'\\\\\'\"');
        });
      });
    });

    describe('Test files with multiple test cases', function() {
      it('7th test file match suite 7 and description 7.1', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t7.spec.js'];
        expect(path.describe[0]).toBe('s7');
        expect(path.it[0]).toBe('d7.1');
      });

      it('7th test file match suite 7.2 and description 7.2 (sibling)', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t7.spec.js'];
        expect(path.describe[1]).toBe('s7.2');
        expect(path.it[1]).toBe('d7.2');
      });

      it('7th test file match suite 7.3 and description 7.3 (sibling)', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t7.spec.js'];
        expect(path.describe[2]).toBe('s7.3');
        expect(path.it[2]).toBe('d7.3');
      });

      it('7th test file match suite 7.4.1 and description 7.4.1 (nested)', function() {
        var paths = pathFinder.parseTestFiles('**/*.spec.ts', 'utf-8');
        var path = paths['path/t7.spec.js'];
        expect(path.describe[4]).toBe('s7.4.1');
        expect(path.it[3]).toBe('d7.4.1');
      });

      it("9st test file match suite 9 and description 9 with skipped test", function() {
        var paths = pathFinder.parseTestFiles("**/*.spec.ts", "utf-8");
        var path = paths["path/t9.spec.js"];
        expect(path.describe[0]).toBe("s9");
        expect(path.it[0]).toBe("d9.1");
        expect(path.it[1]).toBe("d9.2");
      });
    });
  });

  describe('Find test file path tests', function() {
    it('Test file path not found', function() {
        expect(pathFinder.testFile(parsedTestFiles, 's7', 'd7'))
          .toBeUndefined();
    });

    it('Suite 1 and description 1 found in test file 1', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's1', 'd1'))
        .toBe('path/t1.spec.js');
    });

    it('Suite 2 and description 2 found in test file 2', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's2', 'd2'))
        .toBe('path/t2.spec.js');
    });

    it('Suite 3 and description 3 found in test file 3.1', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's3', 'd3.1'))
        .toBe('path/t3.spec.js');
    });

    it('Suite 3 and description 3 found in test file 3.2', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's3', 'd3.2'))
        .toBe('path/t3.spec.js');
    });

    it('Suite 4 and description 4 found in test file 4', function() {
      expect(pathFinder.testFile(parsedTestFiles, '\'s4\'', '\'d4\''))
        .toBe('path/t4.spec.js');
    });

    it('Suite 5 and description 5 found in test file 5', function() {
      expect(pathFinder.testFile(parsedTestFiles, '"s5"', '"d5"'))
        .toBe('path/t5.spec.js');
    });

    it('Suite 6 and description 6 found in test file 6', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's6"\'\'"', 'd6"\'\'"'))
        .toBe('path/t6.spec.js');
    });

    it('Suite 7 and description 7 found in test file 7', function() {
      expect(pathFinder.testFile(parsedTestFiles, 's7',  'd7.1')).toBe('path/t7.spec.js');
      expect(pathFinder.testFile(parsedTestFiles, 's7.2', 'd7.2')).toBe('path/t7.spec.js');
      expect(pathFinder.testFile(parsedTestFiles, 's7.3', 'd7.3')).toBe('path/t7.spec.js');
      expect(pathFinder.testFile(parsedTestFiles, 's7.4.1text', 'd7.4.1text')).toBe('path/t7.spec.js');
    });
  });
});
