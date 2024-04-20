const { Buffer } = require('buffer');
const crypto = require('crypto');

const { Editor } = require('./editor');
const { ContentFile, FileAttributes } = require('./file');
const { PackOptions } = require('./packoptions');

const wfldparse = require('./wfld-rfld-dhdr/parse');
const wfldcreate = require('./wfld-rfld-dhdr/create');

const idxdparse = require('./idxd-flgd/parse');
const idxdcreate = require('./idxd-flgd/create');

module.exports = {
  Editor,
  crypto,
  Buffer,
  FileAttributes,
  ContentFile,
  PackOptions,

  parsers: {
    wfld: wfldparse.parse,
    idxd: idxdparse.parse,
  },
  packers: {
    wfld: wfldcreate.create,
    idxd: idxdcreate.create,
    idxdSplit: idxdcreate.createSplit,
  },
};
