/* eslint-disable node/no-unpublished-require */
/* eslint-env node, mocha */

const assert = require('assert');
const { compress, decompress } = require('lzma');
const { deflate, inflate } = require('pako');
const { create, createSplit } = require('../src/idxd-flgd/create');
const { parse } = require('../src/idxd-flgd/parse');
const { ContentFile } = require('../src/file');
const { Compression } = require('../src/compression');
const {
  UnknownCompressionError,
  InvalidCompressionLevelError,
  InvalidFileCountError,
} = require('../src/errors');

const compression = new Compression();
compression.add(
  'lzma',
  {
    idxd: 'LZMA',
    sprd: 0x4950,
  },
  (data, level) => Buffer.from(compress(data, { level })),
  (data) => Buffer.from(decompress(data)),
);
compression.add(
  'deflate',
  {
    idxd: 'DFLT',
    sprd: 0x4446,
  },
  (data, level) => Buffer.from(deflate(data, { level })),
  (data) => Buffer.from(inflate(data)),
);

describe('idxd: create', () => {
  it('should create a file with one file in it', () => {
    assert.strictEqual(
      parse(
        create([
          new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
        ]),
      ).files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a file with multiple files in it', () => {
    const parsed = parse(
      create([
        new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
        new ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8')),
      ]),
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
      create([
        new ContentFile('test', null, { isDirectory: true }),
        new ContentFile('test/test.txt', Buffer.from('Hello, world!', 'utf8')),
        new ContentFile('test/test', null, { isDirectory: true }),
        new ContentFile(
          'test/test2.txt',
          Buffer.from('Hello, world! 2', 'utf8'),
        ),
      ]),
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

  it('should create an encrypted file', () => {
    const parsed = parse(
      create(
        [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
        { password: 'Password' },
      ),
      { password: 'Password' },
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a LZMA-compressed file', () => {
    const parsed = parse(
      create(
        [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
        { compressionAlgorithm: 'lzma', compression },
      ),
      { compression }
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a DEFLATE-compressed file', () => {
    const parsed = parse(
      create(
        [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
        { compressionAlgorithm: 'deflate', compression },
      ),
      { compression }
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a compressed and encrypted file', () => {
    const parsed = parse(
      create(
        [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
        { compressionAlgorithm: 'lzma', password: 'Password', compression },
      ),
      { password: 'Password', compression },
    );
    assert.strictEqual(
      parsed.files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should create a file with the correct attributes', () => {
    const parsed = parse(
      create([
        new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
          owner: 'Owner',
          group: 'Group',
          webLink: 'https://pages.leox.dev/test.txt',
          created: new Date(1188518400000),
          modified: new Date(1188518400000),
          accessed: new Date(1188518400000),
          permissions: 318,
          isDirectory: false,
          isHidden: true,
          isSystem: true,
          enableBackup: true,
          requireBackup: true,
          isReadOnly: true,
          isMainFile: true,
        }),
      ]),
    );

    assert.strictEqual(parsed.files[0].attributes.owner, 'Owner');
    assert.strictEqual(parsed.files[0].attributes.group, 'Group');
    assert.strictEqual(
      parsed.files[0].attributes.webLink,
      'https://pages.leox.dev/test.txt',
    );
    assert.strictEqual(
      parsed.files[0].attributes.created.getTime(),
      1188518400000,
    );
    assert.strictEqual(
      parsed.files[0].attributes.modified.getTime(),
      1188518400000,
    );
    assert.strictEqual(
      parsed.files[0].attributes.accessed.getTime(),
      1188518400000,
    );
    assert.strictEqual(parsed.files[0].attributes.permissions, 318);
    assert.strictEqual(parsed.files[0].attributes.isDirectory, false);
    assert.strictEqual(parsed.files[0].attributes.isHidden, true);
    assert.strictEqual(parsed.files[0].attributes.isSystem, true);
    assert.strictEqual(parsed.files[0].attributes.enableBackup, true);
    assert.strictEqual(parsed.files[0].attributes.requireBackup, true);
    assert.strictEqual(parsed.files[0].attributes.isReadOnly, true);
    assert.strictEqual(parsed.files[0].attributes.isMainFile, true);
  });

  it('should create a split file (2 files)', () => {
    const created = createSplit(
      [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
      2,
    );
    const parsed = [parse(created[0]), parse(created[1])];

    assert.strictEqual(
      parsed[0].files[0].contents.toString('utf8') +
        parsed[1].files[0].contents.toString('utf8'),
      'Hello, world!',
    );
    assert.strictEqual(parsed[0].nextChecksum, parsed[1].checksum);
    assert.strictEqual(parsed[0].checksum, parsed[1].prevChecksum);
  });

  it('should create a split file (3 files)', () => {
    const created = createSplit(
      [new ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
      3,
    );
    const parsed = [parse(created[0]), parse(created[1]), parse(created[2])];

    assert.strictEqual(
      parsed[0].files[0].contents.toString('utf8') +
        parsed[1].files[0].contents.toString('utf8') +
        parsed[2].files[0].contents.toString('utf8'),
      'Hello, world!',
    );
    assert.strictEqual(parsed[0].nextChecksum, parsed[1].checksum);
    assert.strictEqual(parsed[1].nextChecksum, parsed[2].checksum);
  });

  it('should create a split file with a directory in it', () => {
    const created = createSplit(
      [
        new ContentFile('test', null, { isDirectory: true }),
        new ContentFile('test/test.txt', Buffer.from('Hello, world!', 'utf8')),
      ],
      2,
    );
    const parsed = [parse(created[0]), parse(created[1])];

    assert.ok(parsed[0].files[0].attributes.isDirectory);
    assert.strictEqual(
      parsed[0].files[1].contents.toString('utf8') +
        parsed[1].files[0].contents.toString('utf8'),
      'Hello, world!',
    );
  });

  it('should throw an error when the compression level is invalid', () => {
    assert.throws(() => {
      create([], { compressionLevel: 10 });
    }, InvalidCompressionLevelError);
  });

  it('should throw an error when the compression algorithm is unknown', () => {
    assert.throws(() => {
      create([], { compressionAlgorithm: '???' });
    }, UnknownCompressionError);
  });

  it('should throw an error when the file is split into less than 2 parts', () => {
    assert.throws(() => {
      createSplit([], 1);
    }, InvalidFileCountError);
  });
});
