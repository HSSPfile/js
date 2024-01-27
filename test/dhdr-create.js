/* eslint-env node, mocha */

const assert = require('assert');
const { create } = require('../src/wfld-rfld-dhdr/create');
const { parse } = require('../src/wfld-rfld-dhdr/parse');
const { ContentFile } = require('../src/file');

describe('dhdr: create', () => {
  it('should create a file with one file in it', () => {
    assert.strictEqual(
      parse(
        create(
          [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
          { dhdr: true },
        ),
        { dhdr: true },
      ).files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a file with multiple files in it', () => {
    const parsed = parse(
      create(
        [
          new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
          new ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8')),
        ],
        { dhdr: true },
      ),
      { dhdr: true },
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
    assert.strictEqual(
      parsed.files[1].contents.toString('utf8'),
      'Hello, world! 2',
    );
  });

  it('should create a file with a directory in it', () => {
    const parsed = parse(
      create(
        [
          new ContentFile('test', null, { isDirectory: true }),
          new ContentFile(
            'test/test.txt',
            Buffer.from('Hello, world!', 'utf8'),
          ),
          new ContentFile('test/test', null, { isDirectory: true }),
          new ContentFile(
            'test/test2.txt',
            Buffer.from('Hello, world! 2', 'utf8'),
          ),
        ],
        { dhdr: true },
      ),
      { dhdr: true },
    );
    assert.ok(parsed.files[0].attributes.isDirectory);
    assert.strictEqual(
      parsed.files[1].contents.toString('utf8'),
      'Hello, world!',
    );
    assert.ok(parsed.files[2].attributes.isDirectory);
    assert.strictEqual(
      parsed.files[3].contents.toString('utf8'),
      'Hello, world! 2',
    );
  });

  it('should create a file with a main file', () => {
    const parsed = parse(
      create(
        [
          new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
          new ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8'), {
            isMainFile: true,
          }),
        ],
        { dhdr: true },
      ),
      { dhdr: true },
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
    assert.strictEqual(
      parsed.files[1].contents.toString('utf8'),
      'Hello, world! 2',
    );
    assert.strictEqual(parsed.files[1].attributes.isMainFile, true);
  });

  it('should create an encrypted file', () => {
    const parsed = parse(
      create(
        [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
        { dhdr: true, password: 'Password' },
      ),
      { dhdr: true, password: 'Password' },
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });
});
