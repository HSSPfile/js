/* eslint-disable node/no-unpublished-require */
/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');
const { compress, decompress } = require('lzma');
const { deflate, inflate } = require('pako');
const { parse } = require('../src/idxd-flgd/parse');
const { Compression } = require('../src/compression');
const {
  MissingPasswordError,
  InvalidPasswordError,
  InvalidChecksumError,
  UnknownCompressionError,
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


describe('idxd: parse', () => {
  it('should parse a file with one file in it', () => {
    const idxd = fs.readFileSync('test/samples/idxd-normal.hssp');
    const { files } = parse(idxd);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a file with multiple files in it', () => {
    const idxd = fs.readFileSync('test/samples/idxd-multiple.hssp');
    const { files } = parse(idxd);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world! 2');
  });

  it('should parse an encrypted file', () => {
    const idxd = fs.readFileSync('test/samples/idxd-encrypted.hssp');
    const { files } = parse(idxd, { password: 'Password' });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a LZMA-compressed file', () => {
    const idxd = fs.readFileSync('test/samples/idxd-comp-lzma.hssp');
    const { files } = parse(idxd, { compression });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a DEFLATE-compressed file', () => {
    const idxd = fs.readFileSync('test/samples/idxd-comp-dflt.hssp');
    const { files } = parse(idxd, { compression });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a compressed and encrypted file', () => {
    const idxd = fs.readFileSync('test/samples/idxd-comp-enc.hssp');
    const { files } = parse(idxd, { password: 'Password', compression });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a split file', () => {
    const idxd0 = fs.readFileSync('test/samples/idxd-splitd-0.hssp');
    const parsed0 = parse(idxd0);
    const idxd1 = fs.readFileSync('test/samples/idxd-splitd-1.hssp');
    const parsed1 = parse(idxd1);
    assert.strictEqual(parsed0.nextChecksum, parsed1.checksum);
    assert.strictEqual(parsed1.prevChecksum, parsed0.checksum);
    assert.strictEqual(parsed0.splitId, 0);
    assert.strictEqual(parsed1.splitId, 1);
    assert.strictEqual(
      parsed0.files[0].attributes.afterMissingBytes,
      parsed1.files[0].attributes.preMissingBytes,
    );
    assert.strictEqual(
      Buffer.concat([
        parsed0.files[0].contents,
        parsed1.files[0].contents,
      ]).toString('utf8'),
      'Hello, world!',
    );
  });

  it('should parse a file that was split in 3 parts', () => {
    const idxd0 = fs.readFileSync('test/samples/idxd-splitt-0.hssp');
    const parsed0 = parse(idxd0);
    const idxd1 = fs.readFileSync('test/samples/idxd-splitt-1.hssp');
    const parsed1 = parse(idxd1);
    const idxd2 = fs.readFileSync('test/samples/idxd-splitt-2.hssp');
    const parsed2 = parse(idxd2);
    assert.strictEqual(parsed0.nextChecksum, parsed1.checksum);
    assert.strictEqual(parsed1.prevChecksum, parsed0.checksum);
    assert.strictEqual(parsed1.nextChecksum, parsed2.checksum);
    assert.strictEqual(parsed2.prevChecksum, parsed1.checksum);
    assert.strictEqual(parsed0.splitId, 0);
    assert.strictEqual(parsed1.splitId, 1);
    assert.strictEqual(parsed2.splitId, 2);
    assert.strictEqual(
      parsed0.files[0].attributes.afterMissingBytes,
      parsed2.files[0].attributes.preMissingBytes,
    );
    assert.strictEqual(
      Buffer.concat([
        parsed0.files[0].contents,
        parsed1.files[0].contents,
        parsed2.files[0].contents,
      ]).toString('utf8'),
      'Hello, world!',
    );
  });

  it('should throw an error if the password is missing', () => {
    const idxd = fs.readFileSync('test/samples/idxd-encrypted.hssp');
    assert.throws(() => parse(idxd), MissingPasswordError);
  });

  it('should throw an error if the password is incorrect', () => {
    const idxd = fs.readFileSync('test/samples/idxd-encrypted.hssp');
    assert.throws(
      () => parse(idxd, { password: 'Wrong password' }),
      InvalidPasswordError,
    );
  });

  it('should throw an error if the checksum is incorrect', () => {
    const idxd = fs.readFileSync('test/samples/idxd-corrupted.hssp');
    assert.throws(() => parse(idxd), InvalidChecksumError);
  });

  it('should throw an error if the compression algorithm is unknown', () => {
    const idxd = fs.readFileSync('test/samples/idxd-comp-unknown.hssp');
    assert.throws(() => parse(idxd), UnknownCompressionError);
  });
});
