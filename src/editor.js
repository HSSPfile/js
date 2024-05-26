/* eslint-disable no-unused-vars */
const { ContentFile, FileAttributes } = require('./file');
const { PackOptions } = require('./packoptions');
/* eslint-enable no-unused-vars */

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
    createSplit: idxdcreate.createSplit,
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
    createSplit: (f, c, o) => 
      idxdcreate.createSplit(f, c, {
        flgd: true,
        ...(o ?? {}),
      }),
  },
};

/**
 * The editor class. This class is used to create and edit HSSP files.
 * @preserve
 */
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

  /**
   * @param {string} comment
   * @preserve
   */
  set comment(comment) {
    this.#comment = comment;
  }

  /**
   * @returns {string}
   * @preserve
   */
  get comment() {
    return this.#comment;
  }

  /**
   * @returns {Array<ContentFile>}
   * @preserve
   */
  listFiles() {
    return this.#files.map((f) => f.path);
  }

  /**
   * @param {string} path
   * @returns {ContentFile}
   * @preserve
   */
  getFile(path) {
    return this.#files.find((f) => f.path === path);
  }

  /**
   * @param {string} path
   * @preserve
   */
  removeFile(path) {
    this.#files = this.#files.filter((f) => f.path !== path);
  }

  /**
   * @param {string} path
   * @preserve
   */
  removeFolder(path) {
    this.#files = this.#files.filter((f) => !f.path.startsWith(path));
  }

  /**
   * @param {string} path
   * @param {FileAttributes} [attributes]
   * @preserve
   */
  createFolder(path, attributes) {
    this.#files.push({
      path,
      contents: null,
      attributes: { ...attributes, isDirectory: true },
    });
  }

  /**
   * @param {string} path
   * @param {Buffer} contents
   * @param {FileAttributes} [attributes]
   * @preserve
   */
  createFile(path, contents, attributes) {
    this.#files.push({
      path,
      contents,
      attributes: { ...attributes, isDirectory: false },
    });
  }

  /**
   * @param {PackOptions} options 
   * @returns {Buffer}
   * @preserve
   */
  pack(options) {
    const version = options?.version ?? 5;
    return v[version].create(this.#files, options);
  }

  /**
   * @param {number} count
   * @param {PackOptions} options 
   * @returns {Buffer[]}
   * @preserve
   */
  packMultiple(count, options) {
    const version = options?.version ?? 5;
    return v[version].createSplit(this.#files, count, {comment: this.#comment, ...options});
  }
}

module.exports = { Editor };