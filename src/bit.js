function byteToBits(byte) {
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

function bitsToByte(bits) {
  return bits.reduce((acc, bit, i) => acc + (bit ? 2 ** (7 - i) : 0), 0);
}

module.exports = { byteToBits, bitsToByte };
