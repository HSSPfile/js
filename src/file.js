class ContentFile {
  #attrib;

  /**
   * @param {string} path
   * @param {Buffer} contents
   * @param {Object} [attrib={}]
   * @param {string} [attrib.owner='']
   * @param {string} [attrib.group='']
   * @param {string} [attrib.webLink='']
   * @param {Date} [attrib.created=new Date(0)]
   * @param {Date} [attrib.modified=new Date(0)]
   * @param {Date} [attrib.accessed=new Date(0)]
   * @param {number} [attrib.permissions=0]
   * @param {boolean} [attrib.isDirectory=false]
   * @param {boolean} [attrib.isHidden=false]
   * @param {boolean} [attrib.isSystem=false]
   * @param {boolean} [attrib.enableBackup=true]
   * @param {boolean} [attrib.requireBackup=false]
   * @param {boolean} [attrib.isReadOnly=false]
   * @param {boolean} [attrib.isMainFile=false]
   * @param {number} [attrib.preMissingBytes=0]
   * @param {number} [attrib.afterMissingBytes=0]
   */
  constructor(path, contents, attrib) {
    this.path = path;
    this.contents = contents;
    this.#attrib = {
      owner: attrib?.owner ?? '',
      group: attrib?.group ?? '',
      webLink: attrib?.webLink ?? '',
      created: attrib?.created ?? new Date(0),
      modified: attrib?.modified ?? new Date(0),
      accessed: attrib?.accessed ?? new Date(0),
      permissions: attrib?.permissions ?? 0,
      isDirectory: attrib?.isDirectory ?? false,
      isHidden: attrib?.isHidden ?? false,
      isSystem: attrib?.isSystem ?? false,
      enableBackup: attrib?.enableBackup ?? true,
      requireBackup: attrib?.requireBackup ?? false,
      isReadOnly: attrib?.isReadOnly ?? false,
      isMainFile: attrib?.isMainFile ?? false,
      preMissingBytes: attrib?.preMissingBytes ?? 0,
      afterMissingBytes: attrib?.afterMissingBytes ?? 0,
    };
  }

  /**
   * @returns {{owner: string, group: string, webLink: string, created: Date, modified: Date, accessed: Date, permissions: number, isDirectory: boolean, isHidden: boolean, isSystem: boolean, enableBackup: boolean, requireBackup: boolean, isReadOnly: boolean, isMainFile: boolean, preMissingBytes: number, afterMissingBytes: number}}}
   */
  get attributes() {
    return this.#attrib;
  }

  /**
   * @param {Object} [attrib={}]
   * @param {string} [attrib.owner='']
   * @param {string} [attrib.group='']
   * @param {string} [attrib.webLink='']
   * @param {Date} [attrib.created=new Date(0)]
   * @param {Date} [attrib.modified=new Date(0)]
   * @param {Date} [attrib.accessed=new Date(0)]
   * @param {number} [attrib.permissions=0]
   * @param {boolean} [attrib.isDirectory=false]
   * @param {boolean} [attrib.isHidden=false]
   * @param {boolean} [attrib.isSystem=false]
   * @param {boolean} [attrib.enableBackup=true]
   * @param {boolean} [attrib.requireBackup=false]
   * @param {boolean} [attrib.isReadOnly=false]
   * @param {boolean} [attrib.isMainFile=false]
   * @param {number} [attrib.preMissingBytes=0]
   * @param {number} [attrib.afterMissingBytes=0]
   */
  set attributes(attrib) {
    /* istanbul ignore next */
    this.#attrib = {
      owner: attrib?.owner ?? '',
      group: attrib?.group ?? '',
      webLink: attrib?.webLink ?? '',
      created: attrib?.created ?? new Date(0),
      modified: attrib?.modified ?? new Date(0),
      accessed: attrib?.accessed ?? new Date(0),
      permissions: attrib?.permissions ?? 0,
      isDirectory: attrib?.isDirectory ?? false,
      isHidden: attrib?.isHidden ?? false,
      isSystem: attrib?.isSystem ?? false,
      enableBackup: attrib?.enableBackup ?? true,
      requireBackup: attrib?.requireBackup ?? false,
      isReadOnly: attrib?.isReadOnly ?? false,
      isMainFile: attrib?.isMainFile ?? false,
      preMissingBytes: attrib?.preMissingBytes ?? 0,
      afterMissingBytes: attrib?.afterMissingBytes ?? 0,
    };
  }
}

module.exports = { ContentFile };
