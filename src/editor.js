// eslint-disable-next-line no-unused-vars
const { Buffer } = require('buffer'); // this is required to make Buffer available everywhere

const wfldparse = require('./wfld-rfld-dhdr/parse');
const wfldcreate = require('./wfld-rfld-dhdr/create');

const idxdparse = require('./idxd-flgd/parse');
const idxdcreate = require('./idxd-flgd/create');

const v = {
  1: {
    parse: wfldparse.parse,
    create: (f, o) =>
      wfldcreate.create(f, {
        wfld: true,
        ...(o ?? {}),
      }),
  },
  2: {
    parse: wfldparse.parse,
    create: wfldcreate.create,
  },
  3: {
    parse: (b, o) =>
      wfldparse.parse(b, {
        dhdr: true,
        ...(o ?? {}),
      }),
    create: (f, o) =>
      wfldcreate.create(f, {
        dhdr: true,
        ...(o ?? {}),
      }),
  },
  4: {
    parse: idxdparse.parse,
    create: idxdcreate.create,
  },
  5: {
    parse: (b, o) =>
      idxdparse.parse(b, {
        flgd: true,
        ...(o ?? {}),
      }),
    create: (f, o) =>
      idxdcreate.create(f, {
        flgd: true,
        ...(o ?? {}),
      }),
  },
};

class Editor {
  #files = [];

  #comment;

  /**
   * @param {Buffer} [binary]
   * @param {Object} [options]
   * @param {number} [options.version]
   * @param {string} [options.password]
   * @param {boolean} [options.allowUnsafeOperations=false]
   * @preserve
   */
  constructor(binary, options) {
    if (binary) this.import(binary, options);
  }

  /**
   * @param {Buffer} binary
   * @param {Object} [options]
   * @param {number} [options.version]
   * @param {string} [options.password]
   * @param {boolean} [options.allowUnsafeOperations=false]
   * @preserve
   */
  import(binary, options) {
    const version = options?.version ?? 5;
    this.#files = v[version].parse(binary, options);
  }

  set comment(comment) {
    this.#comment = comment;
  }

  get comment() {
    return this.#comment;
  }

  listFiles() {
    return this.#files.map((f) => f.path);
  }

  getFile(path) {
    return this.#files.find((f) => f.path === path);
  }

  removeFile(path) {
    this.#files = this.#files.filter((f) => f.path !== path);
  }

  removeFolder(path) {
    this.#files = this.#files.filter((f) => !f.path.startsWith(path));
  }

  createFolder(path, attributes) {
    this.#files.push({
      path,
      contents: null,
      attributes: { ...attributes, isDirectory: true },
    });
  }

  createFile(path, contents, attributes) {
    this.#files.push({
      path,
      contents,
      attributes: { ...attributes, isDirectory: false },
    });
  }
}

module.exports = { Editor };
