/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');
const { parse } = require('../src/wfld-rfld-dhdr/parse');
const {
  InvalidChecksumError,
  InvalidPasswordError,
  MissingPasswordError,
} = require('../src/errors');

describe('rfld: parse', () => {
  it('should parse a file with one file in it', () => {
    const rfld = fs.readFileSync('test/samples/rfld-normal.hssp');
    const { files } = parse(rfld);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a file with multiple files in it', () => {
    const rfld = fs.readFileSync('test/samples/rfld-multiple.hssp');
    const { files } = parse(rfld);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world! 2');
  });

  it('should detect the main file', () => {
    const rfld = fs.readFileSync('test/samples/rfld-withmain.hssp');
    const { files } = parse(rfld);
    assert.strictEqual(files[0].attributes.isMainFile, true);
  });

  it('should parse an encrypted file', () => {
    const rfld = fs.readFileSync('test/samples/rfld-encrypted.hssp');
    const { files } = parse(rfld, { password: 'Password' });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a folder with a file in it', () => {
    const rfld = fs.readFileSync('test/samples/rfld-folder.hssp');
    const { files } = parse(rfld);
    assert.strictEqual(files[0].contents, null);
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world!');
  });

  it('should throw an error if the password is missing', () => {
    const rfld = fs.readFileSync('test/samples/rfld-encrypted.hssp');
    assert.throws(() => parse(rfld), MissingPasswordError);
  });

  it('should throw an error if the password is incorrect', () => {
    const rfld = fs.readFileSync('test/samples/rfld-encrypted.hssp');
    assert.throws(
      () => parse(rfld, { password: 'Wrong password' }),
      InvalidPasswordError,
    );
  });

  it('should throw an error if the checksum is incorrect', () => {
    const rfld = fs.readFileSync('test/samples/rfld-corrupted.hssp');
    assert.throws(() => parse(rfld), InvalidChecksumError);
  });
});
