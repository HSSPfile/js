/* eslint-disable no-unused-vars */
const { Compression } = require('./compression');

/**
 * @typedef {Object} PackOptions
 * @property {number} [compressionLevel=5] The compression level to use.
 * @property {Compression} [compression] The compression instance to use.
 * @property {string} [compressionAlgorithm] The compression algorithm to use.
 * @property {string} [password] The password to encrypt the files.
 * @property {string} [comment] The comment to add to the files.
 * @preserve
 */
class PackOptions {}

module.exports = { PackOptions };
