[![GitHub](https://img.shields.io/github/license/HSSPfile/js?style=for-the-badge)](LICENSE)
[![npm](https://img.shields.io/npm/v/hssp?style=for-the-badge)](https://npmjs.com/package/hssp)
[![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/m/HSSPfile/js?style=for-the-badge)](https://github.com/HSSPfile/js/commits/main)
[![npm](https://img.shields.io/npm/dm/hssp?style=for-the-badge)](https://npmjs.com/package/hssp)
[![jsDelivr hits (npm scoped)](https://img.shields.io/jsdelivr/npm/hm/hssp?style=for-the-badge)](https://www.jsdelivr.com/package/npm/hssp)
[![GitHub issues](https://img.shields.io/github/issues/HSSPfile/js?style=for-the-badge)](https://github.com/HSSPfile/js/issues)
[![npm bundle size](https://img.shields.io/bundlephobia/min/hssp?style=for-the-badge)](.)
[![GitHub Repo stars](https://img.shields.io/github/stars/HSSPfile/js?style=for-the-badge)](https://github.com/HSSPfile/js/stargazers)

# HSSP for JavaScript

#### Handle HSSP files easily with the official HSSP JavaScript API for Node.js and web.

###### [Read more about the HSSP file format](https://hssp.leox.dev/)

---

## Usage

### Node.js

- Install HSSP for JavaScript with `npm i hssp`
- Create an editor:

```js
const hssp = require('hssp');

const editor = new hssp.Editor();
```

Continue with [learning about the API](#api).

### Web

- Load HSSP for JavaScript with:

```html
<script src="https://cdn.jsdelivr.net/npm/hssp@5/dist/hssp-web.min.js"></script>
```

- Create an editor:

```js
const editor = new hssp.Editor();
```

Continue with [learning about the API](#api).

### API

#### Handling files & folders

- Add a file (see [Optional parameters](#optional-parameters-for-creating-filesfolders)):

```js
// Node
const fs = require('fs');

editor.createFile('test.txt', fs.readFileSync('test.txt')); // Uses Buffer API

// Web
editor.createFile('test.txt', hssp.Buffer.from('Hello, world!', 'utf8')); // Uses the ported Buffer API
```

- Add a folder (see [Optional parameters](#optional-parameters-for-creating-filesfolders)):

```js
editor.createFolder('my-folder');
```

- Add a file to `my-folder`:

```js
editor.addFile('my-folder/test.txt', fs.readFileSync('test2.txt'));
```

- Delete a file:

**Note:** _This method will return the file Buffer._

```js
editor.removeFile('test.txt');
```

- Delete a folder:

```js
editor.removeFolder('my-folder'); // This will also remove all files in the folder (recrusive removal)
```

#### Modifiying the output

- Set output file version:

```js
editor.pack({ version: 5 }); // 5 is set by default, 1-5 are valid version numbers
```

- Enable output encryption:

```js
editor.pack({ password: 'mysupersecretpassword' });
```

- Enable output compression (you have to provide a compression method yourself):

**Note:** _Requires pack version is 4 or higher._

```js
const { compress, decompress } = require('lzma');

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

editor.pack({
  compression,
  compressionAlgorithm: 'lzma',
  compressionLevel: 5, // 5 is set by default, 0-9 are valid compression levels
});
```

- Add a comment:

**Note:** _Requires editor.version is 4 or higher. The comment can be up to 16 characters (UTF-8) long._

```js
editor.comment = 'Hello :)';

// or do it directly within the pack method
editor.pack({ comment: 'Hello :)' }); // This will overwrite the previous comment
```

#### Importing HSSP files

Currently supports HSSP 1-5.

- Importing HSSP files _without_ encryption:

```js
editor.import(fs.readFileSync('pictures.hssp')); // You can provide a version number in a second parameter if it's not the default 5

// with version detection:
const file = fs.readFileSync('pictures.hssp');
editor.import(file, { version: hssp.detectVersion(file) }); // this will definetly get the right version but is a bit slower
```

- Importing HSSP files _with_ encryption:

```js
editor.import(fs.readFileSync('pictures.hssp'), { password: 'mysupersecretpassword' });
```

#### Creating HSSP files

Currently supports HSSP 1-5.

- Creating _one_ file:

```js
fs.writeFileSync('test.hssp', editor.pack());
```

- Creating _multiple_ files:

**Note:** _This method can only be used if the pack version is 4 or higher. You also cannot create more files than bytes included._

```js
const bufs = editor.packMultiple(4);
fs.writeFileSync('test-part1.hssp', bufs[0]);
fs.writeFileSync('test-part2.hssp', bufs[1]);
fs.writeFileSync('test-part3.hssp', bufs[2]);
fs.writeFileSync('test-part4.hssp', bufs[3]);
```

#### Fetching metadata from HSSP file

Currently supports HSSP 1-5.

Fetching metadata is as simple as that:

**Note:** _You have to know the version codename of the file._

```js
const metadata = hssp.parsers.idxd(fs.readFileSync('pictures.hssp'), { flgd: true });
```
## Contributing

Feel free to contribute by [opening an issue](https://github.com/HSSPfile/js/issues/new/choose) and requesting new features, reporting bugs or just asking questions.

You can also [fork the repository](https://github.com/HSSPfile/js/fork) and open a [pull request](https://github.com/HSSPfile/js/pulls) after making some changes like fixing bugs.

Please note that you have to follow the ESLint rules and the code style of the project.

## [License](LICENSE)

HSSP for JavaScript is licensed under MIT license.
