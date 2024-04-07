const { UnknownCompressionError } = require('./errors');

class Compression {
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
}

module.exports = { Compression };
