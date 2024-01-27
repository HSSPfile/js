/* eslint-disable max-classes-per-file */

class InvalidChecksumError extends Error {
  constructor(expected, actual) {
    super(`Invalid checksum: expected ${expected}, got ${actual}`);
  }
}

class InvalidPasswordError extends Error {
  constructor(expected, actual) {
    super(`Invalid password: expected ${expected}, got ${actual}`);
  }
}

class MissingPasswordError extends Error {
  constructor(pwdhash) {
    super(`Missing password: password hash is ${pwdhash}`);
  }
}

/* istanbul ignore next */
class UnsafeOperationError extends Error {
  constructor(operation) {
    super(`Unsafe operation: ${operation}`);
  }
}

class UnknownCompressionError extends Error {
  constructor(algorithm) {
    super(`Unknown compression algorithm: ${algorithm}`);
  }
}

class InvalidCompressionLevelError extends Error {
  constructor(level) {
    super(`Invalid compression level: ${level}`);
  }
}

class InvalidFileCountError extends Error {
  constructor(actual) {
    super(`Invalid file count: got ${actual}, may not be less than 1 or more than total bytes that should be included in the archive`);
  }
};

module.exports = {
  InvalidChecksumError,
  InvalidPasswordError,
  MissingPasswordError,
  UnsafeOperationError,
  UnknownCompressionError,
  InvalidCompressionLevelError,
  InvalidFileCountError,
};
