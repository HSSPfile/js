/* eslint-disable node/no-unpublished-require */
/* eslint-env node, mocha */

const assert = require('assert');
const fs = require('fs');
const { parse } = require('../src/idxd-flgd/parse');

describe('flgd: parse', () => {
  it('should parse a file with one file in it', () => {
    const flgd = fs.readFileSync('test/samples/flgd-normal.hssp');
    const { files } = parse(flgd, { flgd: true });
    assert.strictEqual(files[0].contents.toString('utf8'), 'Hello, world!');
  });
});