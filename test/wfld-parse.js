/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');
const { parse } = require('../src/wfld-rfld-dhdr/parse');
const {
  InvalidChecksumError,
  InvalidPasswordError,
  MissingPasswordError,
} = require('../src/errors');

describe('wfld: parse', () => {
  it('should parse a file with one file in it', () => {
    const wfld = fs.readFileSync('test/samples/wfld-normal.hssp');
    const { files } = parse(wfld);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a file with multiple files in it', () => {
    const wfld = fs.readFileSync('test/samples/wfld-multiple.hssp');
    const { files } = parse(wfld);
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world! 2');
  });

  it('should detect the main file', () => {
    const wfld = fs.readFileSync('test/samples/wfld-withmain.hssp');
    const { files } = parse(wfld);
    assert.strictEqual(files[0].attributes.isMainFile, true);
  });

  it('should parse an encrypted file', () => {
    const wfld = fs.readFileSync('test/samples/wfld-encrypted.hssp');
    const { files } = parse(wfld, { password: 'Password' });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });

  it('should parse a folder with a file in it', () => {
    const wfld = fs.readFileSync('test/samples/wfld-folder.hssp');
    const { files } = parse(wfld);
    assert.strictEqual(files[0].contents, null);
    assert.strictEqual(files[1].contents.toString('utf8'), 'Hello, world!');
  });

  it('should throw an error if the password is missing', () => {
    const wfld = fs.readFileSync('test/samples/wfld-encrypted.hssp');
    assert.throws(() => parse(wfld), MissingPasswordError);
  });

  it('should throw an error if the password is incorrect', () => {
    const wfld = fs.readFileSync('test/samples/wfld-encrypted.hssp');
    assert.throws(
      () => parse(wfld, { password: 'Wrong password' }),
      InvalidPasswordError,
    );
  });

  it('should throw an error if the checksum is incorrect', () => {
    const wfld = fs.readFileSync('test/samples/wfld-corrupted.hssp');
    assert.throws(() => parse(wfld), InvalidChecksumError);
  });
});
