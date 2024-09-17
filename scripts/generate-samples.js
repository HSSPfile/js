const fs = require('fs');
const hssp = require('../src/main');
const { compress, decompress } = require('lzma');
const { deflate, inflate } = require('pako');

if (!fs.existsSync('test/samples')) fs.mkdirSync('test/samples');

const compression = new hssp.Compression();
compression.add(
  'lzma',
  {
    idxd: 'LZMA',
    sprd: 0x4950,
  },
  (data, level) => Buffer.from(compress(data, { level })),
  (data) => Buffer.from(decompress(data)),
);
compression.add(
  'deflate',
  {
    idxd: 'DFLT',
    sprd: 0x4446,
  },
  (data, level) => Buffer.from(deflate(data, { level })),
  (data) => Buffer.from(inflate(data)),
);

// wfld
{
  // normal
  let buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
    { wfld: true },
  );
  fs.writeFileSync('test/samples/wfld-normal.hssp', buf);

  // multiple
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
      new hssp.ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8')),
    ],
    { wfld: true },
  );
  fs.writeFileSync('test/samples/wfld-multiple.hssp', buf);

  // withmain
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
        isMainFile: true,
      }),
    ],
    { wfld: true },
  );
  fs.writeFileSync('test/samples/wfld-withmain.hssp', buf);

  // encrypted
  buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
    { wfld: true, password: 'Password' },
  );
  fs.writeFileSync('test/samples/wfld-encrypted.hssp', buf);

  // folder
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test', null, { isDirectory: true }),
      new hssp.ContentFile(
        'test/test.txt',
        Buffer.from('Hello, world!', 'utf8'),
      ),
    ],
    { wfld: true },
  );
  fs.writeFileSync('test/samples/wfld-folder.hssp', buf);

  // corrupted
  buf = fs.readFileSync('test/samples/wfld-normal.hssp');
  buf.writeUint32LE(119539761, 4);
  fs.writeFileSync('test/samples/wfld-corrupted.hssp', buf);
}

// rfld
{
  // normal
  let buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
  );
  fs.writeFileSync('test/samples/rfld-normal.hssp', buf);

  // multiple
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
      new hssp.ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8')),
    ],
  );
  fs.writeFileSync('test/samples/rfld-multiple.hssp', buf);

  // withmain
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
        isMainFile: true,
      }),
    ],
  );
  fs.writeFileSync('test/samples/rfld-withmain.hssp', buf);

  // encrypted
  buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
    { password: 'Password' },
  );
  fs.writeFileSync('test/samples/rfld-encrypted.hssp', buf);

  // folder
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test', null, { isDirectory: true }),
      new hssp.ContentFile(
        'test/test.txt',
        Buffer.from('Hello, world!', 'utf8'),
      ),
    ],
  );
  fs.writeFileSync('test/samples/rfld-folder.hssp', buf);

  // corrupted
  buf = fs.readFileSync('test/samples/rfld-normal.hssp');
  buf.writeUint32LE(119539761, 4);
  fs.writeFileSync('test/samples/rfld-corrupted.hssp', buf);
}

// dhdr
{
  // normal
  let buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
    { dhdr: true },
  );
  fs.writeFileSync('test/samples/dhdr-normal.hssp', buf);

  // multiple
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8')),
      new hssp.ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8')),
    ],
    { dhdr: true },
  );
  fs.writeFileSync('test/samples/dhdr-multiple.hssp', buf);

  // withmain
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
        isMainFile: true,
      }),
    ],
    { dhdr: true },
  );
  fs.writeFileSync('test/samples/dhdr-withmain.hssp', buf);

  // encrypted
  buf = hssp.packers.wfld(
    [new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'))],
    { dhdr: true, password: 'Password' },
  );
  fs.writeFileSync('test/samples/dhdr-encrypted.hssp', buf);

  // folder
  buf = hssp.packers.wfld(
    [
      new hssp.ContentFile('test', null, { isDirectory: true }),
      new hssp.ContentFile(
        'test/test.txt',
        Buffer.from('Hello, world!', 'utf8'),
      ),
    ],
    { dhdr: true },
  );
  fs.writeFileSync('test/samples/dhdr-folder.hssp', buf);

  // corrupted
  buf = fs.readFileSync('test/samples/dhdr-normal.hssp');
  buf.writeUint32LE(119539761, 4);
  fs.writeFileSync('test/samples/dhdr-corrupted.hssp', buf);
}

// idxd
{
  // normal
  let buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ]);
  fs.writeFileSync('test/samples/idxd-normal.hssp', buf);

  // multiple
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
    new hssp.ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test2.txt',
    }),
  ]);
  fs.writeFileSync('test/samples/idxd-multiple.hssp', buf);

  // encrypted
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { password: 'Password' });
  fs.writeFileSync('test/samples/idxd-encrypted.hssp', buf);

  // comp-lzma
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { compression, compressionAlgorithm: 'lzma' });
  fs.writeFileSync('test/samples/idxd-comp-lzma.hssp', buf);

  // comp-dflt
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { compression, compressionAlgorithm: 'deflate' });
  fs.writeFileSync('test/samples/idxd-comp-dflt.hssp', buf);

  // comp-enc
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { password: 'Password', compression, compressionAlgorithm: 'lzma' });
  fs.writeFileSync('test/samples/idxd-comp-enc.hssp', buf);

  // splitd-0 & splitd-1
  let bufs = hssp.packers.idxdSplit([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], 2);
  fs.writeFileSync('test/samples/idxd-splitd-0.hssp', bufs[0]);
  fs.writeFileSync('test/samples/idxd-splitd-1.hssp', bufs[1]);

  // splitt-0 & splitt-1 & splitt-2
  bufs = hssp.packers.idxdSplit([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], 3);
  fs.writeFileSync('test/samples/idxd-splitt-0.hssp', bufs[0]);
  fs.writeFileSync('test/samples/idxd-splitt-1.hssp', bufs[1]);
  fs.writeFileSync('test/samples/idxd-splitt-2.hssp', bufs[2]);

  // corrupted
  buf = fs.readFileSync('test/samples/idxd-normal.hssp');
  buf.writeUint32LE(119539761, 64);
  fs.writeFileSync('test/samples/idxd-corrupted.hssp', buf);

  // comp-unknown
  buf = fs.readFileSync('test/samples/idxd-comp-lzma.hssp');
  buf.writeUint32LE(119539761, 60);
  fs.writeFileSync('test/samples/idxd-comp-unknown.hssp', buf);
}

// flgd
{
  // normal
  let buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { flgd: true });
  fs.writeFileSync('test/samples/flgd-normal.hssp', buf);

  // multiple
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
    new hssp.ContentFile('test2.txt', Buffer.from('Hello, world! 2', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test2.txt',
    }),
  ], { flgd: true });
  fs.writeFileSync('test/samples/flgd-multiple.hssp', buf);

  // encrypted
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { password: 'Password', flgd: true });
  fs.writeFileSync('test/samples/flgd-encrypted.hssp', buf);

  // comp-lzma
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { compression, compressionAlgorithm: 'lzma', flgd: true });
  fs.writeFileSync('test/samples/flgd-comp-lzma.hssp', buf);

  // comp-dflt
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { compression, compressionAlgorithm: 'deflate', flgd: true });
  fs.writeFileSync('test/samples/flgd-comp-dflt.hssp', buf);

  // comp-enc
  buf = hssp.packers.idxd([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], { password: 'Password', compression, compressionAlgorithm: 'lzma', flgd: true });
  fs.writeFileSync('test/samples/flgd-comp-enc.hssp', buf);

  // splitd-0 & splitd-1
  let bufs = hssp.packers.idxdSplit([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], 2, { flgd: true });
  fs.writeFileSync('test/samples/flgd-splitd-0.hssp', bufs[0]);
  fs.writeFileSync('test/samples/flgd-splitd-1.hssp', bufs[1]);

  // splitt-0 & splitt-1 & splitt-2
  bufs = hssp.packers.idxdSplit([
    new hssp.ContentFile('test.txt', Buffer.from('Hello, world!', 'utf8'), {
      owner: '\0',
      group: '\0',
      webLink: 'https://acridotheres.github.io/hssp-samples/raw/test.txt',
    }),
  ], 3, { flgd: true });
  fs.writeFileSync('test/samples/flgd-splitt-0.hssp', bufs[0]);
  fs.writeFileSync('test/samples/flgd-splitt-1.hssp', bufs[1]);
  fs.writeFileSync('test/samples/flgd-splitt-2.hssp', bufs[2]);

  // corrupted
  buf = fs.readFileSync('test/samples/flgd-normal.hssp');
  buf.writeUint32LE(119539761, 64);
  fs.writeFileSync('test/samples/flgd-corrupted.hssp', buf);

  // comp-unknown
  buf = fs.readFileSync('test/samples/flgd-comp-lzma.hssp');
  buf.writeUint32LE(119539761, 60);
  fs.writeFileSync('test/samples/flgd-comp-unknown.hssp', buf);
}