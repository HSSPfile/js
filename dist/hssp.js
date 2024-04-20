// https://github.com/HSSPfile/js

/*

MIT License

Copyright (c) 2023-2024 Leonard Lesinski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/



'use strict';

var require$$2 = require('buffer');
var require$$1 = require('crypto');
var require$$0 = require('murmurhash-js');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

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
let FileAttributes$1 = class FileAttributes {
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
};

let ContentFile$4 = class ContentFile {
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
    this.#attrib = new FileAttributes$1(attrib);
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
    this.#attrib = new FileAttributes$1(attrib);
  }
};

var file = { ContentFile: ContentFile$4, FileAttributes: FileAttributes$1 };

/**
 * @typedef {Object} PackOptions
 * @property {number} [compressionLevel=5] The compression level to use.
 * @property {string} [compressionAlgorithm] The compression algorithm to use.
 * @property {string} [password] The password to encrypt the files.
 * @property {string} [comment] The comment to add to the files.
 * @preserve
 */

let PackOptions$1 = class PackOptions {};
var packoptions = { PackOptions: PackOptions$1 };

/* eslint-disable max-classes-per-file */

let InvalidChecksumError$2 = class InvalidChecksumError extends Error {
  constructor(expected, actual) {
    super(`Invalid checksum: expected ${expected}, got ${actual}`);
  }
};

let InvalidPasswordError$2 = class InvalidPasswordError extends Error {
  constructor(expected, actual) {
    super(`Invalid password: expected ${expected}, got ${actual}`);
  }
};

let MissingPasswordError$2 = class MissingPasswordError extends Error {
  constructor(pwdhash) {
    super(`Missing password: password hash is ${pwdhash}`);
  }
};

/* istanbul ignore next */
let UnsafeOperationError$2 = class UnsafeOperationError extends Error {
  constructor(operation) {
    super(`Unsafe operation: ${operation}`);
  }
};

let UnknownCompressionError$1 = class UnknownCompressionError extends Error {
  constructor(algorithm) {
    super(`Unknown compression algorithm: ${algorithm}`);
  }
};

let InvalidCompressionLevelError$1 = class InvalidCompressionLevelError extends Error {
  constructor(level) {
    super(`Invalid compression level: ${level}`);
  }
};

let InvalidFileCountError$1 = class InvalidFileCountError extends Error {
  constructor(actual) {
    super(
      `Invalid file count: got ${actual}, may not be less than 1 or more than total bytes that should be included in the archive`,
    );
  }
};

var errors = {
  InvalidChecksumError: InvalidChecksumError$2,
  InvalidPasswordError: InvalidPasswordError$2,
  MissingPasswordError: MissingPasswordError$2,
  UnsafeOperationError: UnsafeOperationError$2,
  UnknownCompressionError: UnknownCompressionError$1,
  InvalidCompressionLevelError: InvalidCompressionLevelError$1,
  InvalidFileCountError: InvalidFileCountError$1,
};

const murmur$3 = require$$0.murmur3;
const crypto$4 = require$$1;
const { Buffer: Buffer$5 } = require$$2;
const {
  InvalidChecksumError: InvalidChecksumError$1,
  InvalidPasswordError: InvalidPasswordError$1,
  MissingPasswordError: MissingPasswordError$1,
  UnsafeOperationError: UnsafeOperationError$1,
} = errors;
const { ContentFile: ContentFile$3 } = file;

/**
 * Parses a HSSP 1-3 file.
 * @param {Buffer} buf The complete HSSP file.
 * @param {Object} [options] Parsing options.
 * @param {boolean} [options.dhdr=false] Whether the file is a HSSP 3 file.
 * @param {string} [options.password] The password to decrypt the file.
 * @returns {{ files: ContentFile[] }} The parsed files.
 * @throws {InvalidChecksumError} The checksum is incorrect.
 * @throws {InvalidPasswordError} The password is incorrect.
 * @throws {MissingPasswordError} The password is missing.
 * @since v5.0.0
 * @preserve
 */
function parse$1(buf, options) {
  const header = buf.subarray(0, options?.dhdr ?? false ? 128 : 64);
  let contents = buf.subarray(
    options?.dhdr ?? false ? 128 : 64,
    buf.byteLength,
  );
  const hash = murmur$3(contents.toString('utf8'), 822616071);
  if (header.readUint32LE(4) !== hash)
    throw new InvalidChecksumError$1(header.readUint32LE(4), hash);

  const fileCount = header.readUint32LE(8);

  if (!header.subarray(12, 60).equals(Buffer$5.alloc(48).fill(0))) {
    const pwdhashGiven = header.subarray(12, 44).toString('hex');
    if (!options?.password) throw new MissingPasswordError$1(pwdhashGiven);
    const pwdhashCalculated = crypto$4
      .createHash('sha256')
      .update(crypto$4.createHash('sha256').update(options.password).digest())
      .digest()
      .toString('hex');
    if (pwdhashCalculated !== pwdhashGiven)
      throw new InvalidPasswordError$1(pwdhashGiven, pwdhashCalculated);

    const iv = header.subarray(44, 60);
    const decipher = crypto$4.createDecipheriv(
      'aes-256-cbc',
      crypto$4.createHash('sha256').update(options.password).digest(),
      iv,
    );
    contents = Buffer$5.concat([decipher.update(contents), decipher.final()]);
  }

  let offs = 0;
  const idxFile = header.readUint32LE(60);

  const files = [];

  for (let i = 0; i < fileCount; i += 1) {
    const nameLength = contents.readUint16LE(offs + 8);
    let name = contents
      .subarray(offs + 10, offs + 10 + nameLength)
      .toString('utf8');

    const isFolder = name.startsWith('//');
    if (isFolder) name = name.slice(2);
    /* istanbul ignore next */
    if (
      contents.readBigUint64LE(offs) > BigInt(Number.MAX_SAFE_INTEGER) &&
      !options?.allowUnsafeOperations
    ) {
      throw new UnsafeOperationError$1(
        'File bigger than 8 Exbibytes so a safe conversion to Number is not possible',
      );
    }

    const dataLength = Number(contents.readBigUint64LE(offs));
    if (!isFolder) {
      const data = contents.subarray(
        offs + 10 + nameLength,
        offs + 10 + nameLength + dataLength,
      );

      files.push(new ContentFile$3(name, data));
    } else {
      files.push(new ContentFile$3(name, null, { isDirectory: true }));
    }

    offs += 10 + nameLength * 2 + dataLength;
  }

  if (idxFile > 0 && idxFile - 1 < files.length)
    files[idxFile - 1].attributes = {
      isMainFile: true,
    };

  return {
    files,
  };
}

var parse_1$1 = { parse: parse$1 };

const murmur$2 = require$$0.murmur3;
const crypto$3 = require$$1;
const { Buffer: Buffer$4 } = require$$2;

/**
 * Creates a HSSP 1-3 file.
 * @param {ContentFile[]} files The contained files.
 * @param {Object} [options] Creation options.
 * @param {boolean} [options.wfld=false] Whether the file is a HSSP 1 file.
 * @param {boolean} [options.dhdr=false] Whether the file is a HSSP 3 file.
 * @param {string} [options.password] The password to encrypt the file.
 * @returns {Buffer} The created HSSP file.
 * @since v5.0.0
 * @preserve
 */
function create$1(files, options) {
  const header = Buffer$4.alloc(options?.dhdr ?? false ? 128 : 64);
  let contents = Buffer$4.alloc(
    files.reduce(
      (total, file) =>
        total +
        (file.attributes.isDirectory ? 14 : 10) +
        file.path.length * 2 +
        (file.attributes.isDirectory ? 0 : file.contents.byteLength),
      0,
    ),
  );

  header.write(options?.wfld ?? false ? 'SFA\x00' : 'HSSP', 0, 'utf8');
  header.writeUint32LE(files.length, 8);

  let offs = 0;
  files.forEach((file, i) => {
    if (file.attributes.isMainFile) header.writeUint32LE(i + 1, 60);
    contents.writeBigUint64LE(
      BigInt(file.attributes.isDirectory ? 0 : file.contents.byteLength),
      offs,
    );
    contents.writeUint16LE(
      (file.attributes.isDirectory ? 2 : 0) + file.path.length,
      offs + 8,
    );
    contents.write(
      (file.attributes.isDirectory ? '//' : '') + file.path,
      offs + 10,
      'utf8',
    );
    if (!file.attributes.isDirectory)
      contents.set(file.contents, offs + 10 + file.path.length);
    offs +=
      (file.attributes.isDirectory ? 14 : 10) +
      file.path.length * 2 +
      (file.attributes.isDirectory ? 0 : file.contents.byteLength);
  });

  if (options?.password) {
    const iv = crypto$3.randomBytes(16);
    header.set(iv, 44);
    const cipher = crypto$3.createCipheriv(
      'aes-256-cbc',
      crypto$3.createHash('sha256').update(options.password).digest(),
      iv,
    );
    contents = Buffer$4.concat([cipher.update(contents), cipher.final()]);

    header.set(
      crypto$3
        .createHash('sha256')
        .update(crypto$3.createHash('sha256').update(options.password).digest())
        .digest(),
      12,
    );
  }

  header.writeUint32LE(murmur$2(contents.toString('utf8'), 822616071), 4);

  return Buffer$4.concat([header, contents]);
}

var create_1$1 = { create: create$1 };

const { UnknownCompressionError } = errors;

let Compression$2 = class Compression {
  #algorithms = {};

  compress(algorithm, data, level) {
    if (!algorithm) return data;
    if (!this.#algorithms[algorithm])
      throw new UnknownCompressionError(algorithm);

    return this.#algorithms[algorithm].compress(data, level);
  }

  decompress(algorithm, data) {
    if (!algorithm) return data;
    if (!this.#algorithms[algorithm])
      throw new UnknownCompressionError(algorithm);

    return this.#algorithms[algorithm].decompress(data);
  }

  add(algorithm, code, compress, decompress) {
    this.#algorithms[algorithm] = { code, compress, decompress };
  }

  getByIdxdCode(code) {
    const index = Object.values(this.#algorithms).findIndex((a) => a.code.idxd === code);
    if (index === -1) throw new UnknownCompressionError(code);
    return Object.keys(this.#algorithms)[index];
  }

  getIdxdCode(algorithm) {
    if (!algorithm) return 'NONE';
    if (!this.#algorithms[algorithm])
      throw new UnknownCompressionError(algorithm);

    return this.#algorithms[algorithm].code.idxd;
  }
};

var compression = { Compression: Compression$2 };

function byteToBits$1(byte) {
  return [
    !!Math.floor(byte / 128),
    !!Math.floor((byte % 128) / 64),
    !!Math.floor((byte % 64) / 32),
    !!Math.floor((byte % 32) / 16),
    !!Math.floor((byte % 16) / 8),
    !!Math.floor((byte % 8) / 4),
    !!Math.floor((byte % 4) / 2),
    !!Math.floor(byte % 2),
  ];
}

function bitsToByte$1(bits) {
  return bits.reduce((acc, bit, i) => acc + (bit ? 2 ** (7 - i) : 0), 0);
}

var bit = { byteToBits: byteToBits$1, bitsToByte: bitsToByte$1 };

const murmur$1 = require$$0.murmur3;
const crypto$2 = require$$1;
const { Buffer: Buffer$3 } = require$$2;
const {
  InvalidChecksumError,
  InvalidPasswordError,
  MissingPasswordError,
  UnsafeOperationError,
} = errors;
const { Compression: Compression$1 } = compression;
const { ContentFile: ContentFile$2 } = file;
const { byteToBits } = bit;

/**
 * @param {Buffer} buf
 * @param {Object} [options]
 * @param {boolean} [options.flgd=false]
 * @param {string} [options.password]
 * @param {Compression} [options.compression] The compression instance to use.
 * @param {boolean} [options.allowUnsafeOperations=false]
 * @preserve
 */
function parse(buf, options) {
  const header = buf.subarray(0, 128);
  let contents = buf.subarray(128, buf.byteLength);
  const hash = murmur$1(contents.toString('utf8'), 822616071);
  if (header.readUint32LE(64) !== hash)
    throw new InvalidChecksumError(header.readUint32LE(4), hash);

  const fileCount = header.readUint32LE(8);

  const flags = byteToBits(header.readUint8(5));

  if (
    options?.flgd
      ? flags[0]
      : !header.subarray(12, 60).equals(Buffer$3.alloc(48).fill(0))
  ) {
    const pwdhashGiven = header.subarray(12, 44).toString('hex');
    if (!options?.password) throw new MissingPasswordError(pwdhashGiven);
    const pwdhashCalculated = crypto$2
      .createHash('sha256')
      .update(crypto$2.createHash('sha256').update(options.password).digest())
      .digest()
      .toString('hex');
    if (pwdhashCalculated !== pwdhashGiven)
      throw new InvalidPasswordError(pwdhashGiven, pwdhashCalculated);

    const iv = header.subarray(44, 60);
    const decipher = crypto$2.createDecipheriv(
      'aes-256-cbc',
      crypto$2.createHash('sha256').update(options.password).digest(),
      iv,
    );
    contents = Buffer$3.concat([decipher.update(contents), decipher.final()]);
  }

  let offs = 0;

  if (options?.flgd ? flags[1] : true) {
    const algorithm = buf.toString('utf8', 60, 64);

    if (!(algorithm === 'NONE' && !options?.flgd)) { // TODO: make this more readable, every time I change something here half of the tests fail
      const compression = options?.compression ?? new Compression$1();
      contents = compression.decompress(
        compression.getByIdxdCode(algorithm),
        contents,
      );
    }
  }

  const index = [];

  for (let i = 0; i < fileCount; i += 1) {
    /* istanbul ignore next */
    if (
      contents.readBigUint64LE(offs) > BigInt(Number.MAX_SAFE_INTEGER) &&
      !options.allowUnsafeOperations
    ) {
      throw new UnsafeOperationError(
        'File bigger than 8 Exbibytes so a safe conversion to Number is not possible',
      );
    }
    const fileLength = Number(contents.readBigUint64LE(offs));

    const nameLength = contents.readUint16LE(offs + 8);
    const name = contents.toString('utf8', offs + 10, offs + 10 + nameLength);

    const ownerLength = contents.readUint16LE(offs + 10 + nameLength);
    const owner = contents.toString(
      'utf8',
      offs + 12 + nameLength,
      offs + 12 + nameLength + ownerLength,
    );

    const groupLength = contents.readUint16LE(
      offs + 12 + nameLength + ownerLength,
    );
    const group = contents.toString(
      'utf8',
      offs + 14 + nameLength + ownerLength,
      offs + 14 + nameLength + ownerLength + groupLength,
    );

    const webLinkLength = contents.readUint32LE(
      offs + 14 + nameLength + ownerLength + groupLength,
    );
    const webLink = contents.toString(
      'utf8',
      offs + 18 + nameLength + ownerLength + groupLength,
      offs + 18 + nameLength + ownerLength + groupLength + webLinkLength,
    );

    const created = new Date(
      contents.readUintLE(
        offs + 18 + nameLength + ownerLength + groupLength + webLinkLength,
        6,
      ),
    );

    const modified = new Date(
      contents.readUintLE(
        offs + 24 + nameLength + ownerLength + groupLength + webLinkLength,
        6,
      ),
    );

    const accessed = new Date(
      contents.readUintLE(
        offs + 30 + nameLength + ownerLength + groupLength + webLinkLength,
        6,
      ),
    );

    const permissions =
      contents.readUint8(
        offs + 36 + nameLength + ownerLength + groupLength + webLinkLength,
      ) *
        2 +
      Math.floor(
        contents.readUint8(
          offs + 37 + nameLength + ownerLength + groupLength + webLinkLength,
        ) / 128,
      );

    const args = byteToBits(
      contents.readUint8(
        offs + 37 + nameLength + ownerLength + groupLength + webLinkLength,
      ),
    );

    index.push({
      name,
      size: fileLength,
      attr: {
        owner,
        group,
        webLink,
        created,
        modified,
        accessed,
        permissions,
        isDirectory: args[1],
        isHidden: args[2],
        isSystem: args[3],
        enableBackup: args[4],
        requireBackup: args[5],
        isReadOnly: args[6],
        isMainFile: args[7],
      },
    });

    offs += 38 + nameLength + ownerLength + groupLength + webLinkLength;
  }

  /* istanbul ignore next */
  if (
    header.readBigUint64LE(76) > BigInt(Number.MAX_SAFE_INTEGER) &&
    !options.allowUnsafeOperations
  ) {
    throw new UnsafeOperationError(
      'Split file offset bigger than 8 Exbibytes so a safe conversion to Number is not possible',
    );
  }
  const totalFileCount = Number(header.readBigUint64LE(68));
  const splitFileOffset = Number(header.readBigUint64LE(76));
  const prevChecksum = header.readUint32LE(84);
  const nextChecksum = header.readUint32LE(88);
  const splitId = header.readUint32LE(92);
  const comment = header.toString('utf8', 96, 112).split('\0')[0];
  const generator = header.toString('utf8', 112, 128).split('\0')[0];
  let overflow = 0;

  const files = index.map((file, i) => {
    if (index.length - 1 === i)
      overflow = offs + file.size - contents.byteLength;
    const rt = new ContentFile$2(
      file.name,
      contents.subarray(offs, offs + file.size),
      {
        ...file.attr,
        preMissingBytes:
          i === 0 && splitFileOffset > 0 ? splitFileOffset - 1 : 0,
        afterMissingBytes: overflow > 0 ? overflow : 0,
      },
    );
    offs += file.size;
    return rt;
  });

  return {
    files,
    totalFileCount,
    splitFileOffset,
    prevChecksum,
    nextChecksum,
    splitId,
    comment,
    generator,
    checksum: hash,
    overflow,
    splitted: options?.flgd ? flags[2] : null,
    isFirst: options?.flgd ? flags[3] : prevChecksum === 0,
    isLast: options?.flgd ? flags[4] : nextChecksum === 0,
  };
}

var parse_1 = { parse };

const murmur = require$$0.murmur3;
const crypto$1 = require$$1;
const { Buffer: Buffer$2 } = require$$2;
const { Compression } = compression;
const { bitsToByte } = bit;
const {
  InvalidCompressionLevelError,
  InvalidFileCountError,
} = errors;
// eslint-disable-next-line no-unused-vars
const { ContentFile: ContentFile$1 } = file;

/**
 * Creates a HSSP 4 or 5 file.
 * @param {ContentFile[]} files The contained files.
 * @param {Object} [options] Creation options.
 * @param {number} [options.compressionLevel=5] The compression level to use.
 * @param {string} [options.compressionAlgorithm] The compression algorithm to use.
 * @param {Compression} [options.compression] The compression instance to use.
 * @param {string} [options.password] The password to encrypt the file.
 * @param {string} [options.comment] The comment to add to the file.
 * @param {boolean} [options.flgd=false] Whether to create a v5 file instead of a v4 file.
 * @param {Object} [options.__split] Split options, only for internal use.
 * @param {number} [options.__split.total] The total amount of files.
 * @param {number} [options.__split.offset] The offset of the file.
 * @param {number} [options.__split.chkPrev] The checksum of the previous file.
 * @param {number} [options.__split.idx] The index of the file.
 * @param {boolean} [options.__split.isFirst] Whether this is the first file.
 * @param {boolean} [options.__split.isLast] Whether this is the last file.
 * @returns {Buffer} The created HSSP file.
 * @since v5.0.0
 * @preserve
 */
function create(files, options) {
  const header = Buffer$2.alloc(128);
  let indexLength = 0;
  let bodyLength = 0;
  for (let i = 0; i < files.length; i += 1) {
    indexLength +=
      38 +
      Buffer$2.from(files[i].path, 'utf8').byteLength +
      Buffer$2.from(files[i].attributes.owner, 'utf8').byteLength +
      Buffer$2.from(files[i].attributes.group, 'utf8').byteLength +
      Buffer$2.from(files[i].attributes.webLink, 'utf8').byteLength;
    bodyLength += files[i].contents !== null ? files[i].contents.byteLength : 0;
  }
  const index = Buffer$2.alloc(indexLength);
  const body = Buffer$2.alloc(bodyLength);

  header.write('HSSP', 0, 4, 'utf8');
  header.writeUint8(4, 4);
  if (options?.flgd) header.writeUint8(5, 4);
  header.writeUint32LE(files.length, 8);
  /* eslint-disable no-underscore-dangle */
  if (options?.flgd)
    header.writeUint8(
      bitsToByte([
        !!options?.password,
        !!options?.compressionAlgorithm,
        !!options?.__split,
        options?.__split?.isFirst ?? true,
        options?.__split?.isLast ?? true,
        false,
        false,
        false,
      ]),
      5,
    );
  if (options?.__split) {
    header.writeBigUint64LE(BigInt(options.__split.total), 68);
    header.writeBigUint64LE(BigInt(options.__split.offset), 76);
    header.writeUint32LE(options.__split.chkPrev, 84);
    header.writeUint32LE(options.__split.idx, 92);
  }
  /* eslint-enable no-underscore-dangle */
  header.write(options?.comment ?? '', 96, 16, 'utf8');
  header.write('hssp 5.0.0 @ npm', 112, 16, 'utf8');

  let indexOffset = 0;
  let bodyOffset = 0;

  for (let i = 0; i < files.length; i += 1) {
    const nl = Buffer$2.from(files[i].path, 'utf8').byteLength;
    const ol = Buffer$2.from(files[i].attributes.owner, 'utf8').byteLength;
    const gl = Buffer$2.from(files[i].attributes.group, 'utf8').byteLength;
    const wl = Buffer$2.from(files[i].attributes.webLink, 'utf8').byteLength;

    index.writeBigInt64LE(
      BigInt(files[i].contents !== null ? files[i].contents.byteLength : 0),
      indexOffset,
    );
    index.writeUint16LE(nl, indexOffset + 8);
    index.write(files[i].path, indexOffset + 10, nl, 'utf8');
    index.writeUint16LE(ol, indexOffset + 10 + nl);
    index.write(files[i].attributes.owner, indexOffset + 12 + nl, ol, 'utf8');
    index.writeUint16LE(gl, indexOffset + 12 + nl + ol);
    index.write(
      files[i].attributes.group,
      indexOffset + 14 + nl + ol,
      gl,
      'utf8',
    );
    index.writeUint32LE(wl, indexOffset + 14 + nl + ol + gl);
    index.write(
      files[i].attributes.webLink,
      indexOffset + 18 + nl + ol + gl,
      wl,
      'utf8',
    );
    index.writeUintLE(
      files[i].attributes.created.getTime(),
      indexOffset + 18 + nl + ol + gl + wl,
      6,
    );
    index.writeUintLE(
      files[i].attributes.modified.getTime(),
      indexOffset + 24 + nl + ol + gl + wl,
      6,
    );
    index.writeUintLE(
      files[i].attributes.accessed.getTime(),
      indexOffset + 30 + nl + ol + gl + wl,
      6,
    );
    index.writeUint8(
      Math.floor(files[i].attributes.permissions / 2),
      indexOffset + 36 + nl + ol + gl + wl,
    );
    index.writeUint8(
      bitsToByte([
        !!(files[i].attributes.permissions % 2),
        files[i].attributes.isDirectory,
        files[i].attributes.isHidden,
        files[i].attributes.isSystem,
        files[i].attributes.enableBackup,
        files[i].attributes.requireBackup,
        files[i].attributes.isReadOnly,
        files[i].attributes.isMainFile,
      ]),
      indexOffset + 37 + nl + ol + gl + wl,
    );
    indexOffset += 38 + nl + ol + gl + wl;

    if (files[i].contents !== null) body.set(files[i].contents, bodyOffset);
    bodyOffset += files[i].contents !== null ? files[i].contents.byteLength : 0;
  }

  let contents = Buffer$2.concat([index, body]);

  if (
    (options?.compressionLevel && options?.compressionLevel < 0) ||
    options?.compressionLevel > 9
  )
    throw new InvalidCompressionLevelError(options?.compressionLevel);

  const compression = options?.compression ?? new Compression();
  contents = compression.compress(options?.compressionAlgorithm, contents, options?.compressionLevel ?? 5);
  header.write(compression.getIdxdCode(options?.compressionAlgorithm), 60, 4, 'utf8');

  if (options?.password) {
    const iv = crypto$1.randomBytes(16);
    header.set(iv, 44);
    const cipher = crypto$1.createCipheriv(
      'aes-256-cbc',
      crypto$1.createHash('sha256').update(options.password).digest(),
      iv,
    );
    contents = Buffer$2.concat([cipher.update(contents), cipher.final()]);

    header.set(
      crypto$1
        .createHash('sha256')
        .update(crypto$1.createHash('sha256').update(options.password).digest())
        .digest(),
      12,
    );
  }

  header.writeUint32LE(murmur(contents.toString('utf8'), 822616071), 64);

  return Buffer$2.concat([header, contents]);
}

/**
 * Creates multiple HSSP 4 files.
 * @param {ContentFile[]} files The contained files.
 * @param {number} count The amount of files to create.
 * @param {Object} [options] Creation options.
 * @param {number} [options.compressionLevel=5] The compression level to use.
 * @param {string} [options.compressionAlgorithm] The compression algorithm to use.
 * @param {string} [options.password] The password to encrypt the files.
 * @param {string} [options.comment] The comment to add to the files.
 * @param {boolean} [options.flgd=false] Whether to create a v5 file instead of a v4 file.
 * @returns {Buffer[]} The created HSSP files.
 * @since v5.0.0
 */
function createSplit(files, count, options) {
  const totalLength = files
    .map((f) => f.contents?.byteLength ?? 0)
    .reduce((a, b) => a + b, 0);
  if (count < 1 || count > totalLength) throw new InvalidFileCountError(count);

  const avgLength = Math.floor(totalLength / count);

  const result = [];

  let offset = 0;
  let file = 0;
  let chkPrev = 0;

  for (let i = 0; i < count; i += 1) {
    const filesIncluded = [];
    let length = 0;
    const maxLength = avgLength + (i === count - 1 ? totalLength % count : 0);

    while (length <= maxLength && file < files.length) {
      filesIncluded.push(
        new ContentFile$1(
          files[file].path,
          files[file].contents?.subarray(offset) ?? null,
          files[file].attributes,
        ),
      );
      length += (files[file].contents?.byteLength ?? 0) - offset;
      if (length <= maxLength) offset = 0;
      file += 1;
    }

    if (length > maxLength) {
      // TODO: Improve this
      file -= 1;
      offset += maxLength + (length % maxLength);
      length = maxLength + (length % maxLength);
      filesIncluded[filesIncluded.length - 1].contents = filesIncluded[
        filesIncluded.length - 1
      ].contents.subarray(0, length);
    }

    result.push(
      create(filesIncluded, {
        ...options,
        __split: {
          total: files.length,
          offset,
          chkPrev,
          idx: i,
          isFirst: i === 0,
          isLast: i === count - 1,
        },
      }),
    );

    chkPrev = result[result.length - 1].readUint32LE(64);
  }

  let chkNext = 0;
  for (let i = result.length - 1; i >= 0; i -= 1) {
    result[i].writeUint32LE(chkNext, 88);
    chkNext = result[i].readUint32LE(64);
  }

  return result;
}

var create_1 = { create, createSplit };

/* eslint-disable no-unused-vars */
/* eslint-enable no-unused-vars */

const wfldparse = parse_1$1;
const wfldcreate = create_1$1;

const idxdparse = parse_1;
const idxdcreate = create_1;

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
let Editor$1 = class Editor {
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
    return v[version].createSplit(this.#files, options);
  }
};

var editor = { Editor: Editor$1 };

const { Buffer: Buffer$1 } = require$$2;
const crypto = require$$1;

const { Editor } = editor;
const { ContentFile, FileAttributes } = file;
const { PackOptions } = packoptions;

var main = {
  Editor,
  crypto,
  Buffer: Buffer$1,
  FileAttributes,
  ContentFile,
  PackOptions,
};

var main$1 = /*@__PURE__*/getDefaultExportFromCjs(main);

module.exports = main$1;
