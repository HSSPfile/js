/* eslint-disable max-classes-per-file */

/**
 * @typedef {Object} FileAttributes
 * @property {string} [owner='']
 * @property {string} [group='']
 * @property {string} [webLink='']
 * @property {Date} [created=new Date(0)]
 * @property {Date} [modified=new Date(0)]
 * @property {Date} [accessed=new Date(0)]
 * @property {number} [permissions=0]
 * @property {boolean} [isDirectory=false]
 * @property {boolean} [isHidden=false]
 * @property {boolean} [isSystem=false]
 * @property {boolean} [enableBackup=true]
 * @property {boolean} [requireBackup=false]
 * @property {boolean} [isReadOnly=false]
 * @property {boolean} [isMainFile=false]
 * @property {number} [preMissingBytes=0]
 * @property {number} [afterMissingBytes=0]
 * @preserve
 */
class FileAttributes {
  owner = '';

  group = '';

  webLink = '';

  created = new Date(0);

  modified = new Date(0);

  accessed = new Date(0);

  permissions = 0;

  isDirectory = false;

  isHidden = false;

  isSystem = false;

  enableBackup = true;

  requireBackup = false;

  isReadOnly = false;

  isMainFile = false;

  preMissingBytes = 0;

  afterMissingBytes = 0;

  constructor(attrib) {
    this.owner = attrib?.owner ?? '';
    this.group = attrib?.group ?? '';
    this.webLink = attrib?.webLink ?? '';
    this.created = attrib?.created ?? new Date(0);
    this.modified = attrib?.modified ?? new Date(0);
    this.accessed = attrib?.accessed ?? new Date(0);
    this.permissions = attrib?.permissions ?? 0;
    this.isDirectory = attrib?.isDirectory ?? false;
    this.isHidden = attrib?.isHidden ?? false;
    this.isSystem = attrib?.isSystem ?? false;
    this.enableBackup = attrib?.enableBackup ?? true;
    this.requireBackup = attrib?.requireBackup ?? false;
    this.isReadOnly = attrib?.isReadOnly ?? false;
    this.isMainFile = attrib?.isMainFile ?? false;
    this.preMissingBytes = attrib?.preMissingBytes ?? 0;
    this.afterMissingBytes = attrib?.afterMissingBytes ?? 0;
  }
}

class ContentFile {
  path = '';

  contents = Buffer.alloc(0);

  #attrib;

  /**
   * @param {string} path
   * @param {Buffer} contents
   * @param {FileAttributes} [attrib]
   * @preserve
   */
  constructor(path, contents, attrib) {
    this.path = path;
    this.contents = contents;
    this.#attrib = new FileAttributes(attrib);
  }

  /**
   * @returns {FileAttributes}
   * @preserve
   */
  get attributes() {
    return this.#attrib;
  }

  /**
   * @param {FileAttributes} [attrib]
   * @preserve
   */
  set attributes(attrib) {
    /* istanbul ignore next */
    this.#attrib = new FileAttributes(attrib);
  }
}

module.exports = { ContentFile, FileAttributes };
