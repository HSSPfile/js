/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');
const { parse } = require('../src/wfld-rfld-dhdr/parse');
const {
  InvalidChecksumError,
  InvalidPasswordError,
  MissingPasswordError,
} = require('../src/errors');

describe('dhdr: parse', () => {
  it('should parse a file with one file in it', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-normal.hssp');
    const { files } = parse(dhdr, { dhdr: true });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a file with multiple files in it', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-multiple.hssp');
    const { files } = parse(dhdr, { dhdr: true });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world! 2');
  });

  it('should detect the main file', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-withmain.hssp');
    const { files } = parse(dhdr, { dhdr: true });
    assert.strictEqual(files[0].attributes.isMainFile, true);
  });

  it('should parse an encrypted file', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-encrypted.hssp');
    const { files } = parse(dhdr, { dhdr: true, password: 'Password' });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a folder with a file in it', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-folder.hssp');
    const { files } = parse(dhdr, { dhdr: true });
    assert.strictEqual(files[0].contents, null);
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world!');
  });

  it('should throw an error if the password is missing', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-encrypted.hssp');
    assert.throws(() => parse(dhdr, { dhdr: true }), MissingPasswordError);
  });

  it('should throw an error if the password is incorrect', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-encrypted.hssp');
    assert.throws(
      () => parse(dhdr, { dhdr: true, password: 'Wrong password' }),
      InvalidPasswordError,
    );
  });

  it('should throw an error if the checksum is incorrect', () => {
    const dhdr = fs.readFileSync('test/samples/dhdr-corrupted.hssp');
    assert.throws(() => parse(dhdr, { dhdr: true }), InvalidChecksumError);
  });
});
