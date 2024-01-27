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

# WARNING: v4.0.0+ is not ready for web yet! V6 (v5.0.0+) Splitting is not done yet!

## Usage

### Node.js

- Install HSSP for JavaScript with `npm i hssp`
- Create an editor:

```js
const HSSP = require('hssp');

const editor = new HSSP.Editor();
```

Continue with [learning about the API](#api).

### Web

- Load HSSP for JavaScript with:

```html
<script src="https://cdn.jsdelivr.net/npm/hssp@3/web.min.js"></script>
```

- Create an editor:

```js
const editor = new HSSP.Editor();
```

Continue with [learning about the API](#api).

### API

#### Handling files & folders

- Add a file (see [Optional parameters](#optional-parameters-for-creating-filesfolders)):

```js
// Node
const fs = require('fs');

editor.addFile('test.txt', fs.readFileSync('test.txt')); // Uses Buffer API

// Web
editor.addFile('test.txt', new TextEncoder().encode('Hello, world!').buffer); // Uses ArrayBuffer API
```

- Add a folder (see [Optional parameters](#optional-parameters-for-creating-filesfolders)):

```js
editor.addFolder('my-folder');
```

- Add a file into `my-folder`:

```js
// Node
editor.addFile('my-folder/test.txt', fs.readFileSync('test2.txt'));

// Web
editor.addFile(
  'my-folder/test.txt',
  new TextEncoder().encode('Hello, world! 2').buffer,
);
```

- Delete a file:

**Note:** _This method will return the file Buffer/ArrayBuffer._

```js
editor.remove('test.txt');
```

- Delete a folder:

```js
editor.remove('my-folder');
```

**Note:** _This will only remove the folder, not the files in it! If you want to remove the folder with the files in it, use:_

```js
var folderName = 'my-folder';

var filesStored = Object.keys(editor.files); // Create a list of all the files in the editor
filesStored.forEach((fileName) => {
  // Loop over all the files stored
  if (fileName.startsWith(folderName + '/')) editor.remove(fileName); // Remove everything starting with folderName/ from the editor
});
editor.remove(folderName); // Remove the folder itself
```

#### Modifiying the output

- Set output file version:

```js
editor.version = 5; // 5 is set by default, 1-5 are valid version numbers
```

- Enable output encryption:

```js
editor.password = 'MySecretPassword'; // write-only
```

- Disable output encryption:

```js
editor.password = null; // Encryption is disabled by default
```

- Enable output compression ([Supported algorithms](#supported-compression-algorithms)):

**Note:** _Requires editor.version is 4 or higher._

```js
editor.compression = { algorithm: 'LZMA', level: 9 }; // Level default is 5
```

- Disable output compression:

```js
editor.compression = null; // default
```

- Add a comment:

**Note:** _Requires editor.version is 4 or higher. The comment can be up to 16 characters (UTF-8) long._

```js
editor.comment = 'Hello :)';
```

#### Importing HSSP files

Currently supports HSSP 1-5.

- Importing HSSP files _without_ encryption:

```js
// Node
editor.import(fs.readFileSync('pictures.hssp'));

// Web
const fileReadEventHandler = (ev) =>
  new Promise((resolve, reject) => {
    const file = ev.target.files[0];
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });

document.querySelector('input[type=file]').onchange = async (ev) => {
  editor.import(await fileReadEventHandler(ev));
};
```

- Importing HSSP files _with_ encryption:

```js
// Node
editor.import(fs.readFileSync('pictures.hssp'));

// Web
document.querySelector('input[type=file]').onchange = async (ev) => {
  editor.import(await fileReadEventHandler(ev), 'MySecretPassword'); // use the fileReadEventHandler function from previous code block
};
```

#### Creating HSSP files

Currently supports HSSP 1-5.

- Creating _one_ file:

```js
// Node
fs.writeFileSync('test.hssp', editor.toBuffer());

// Web
const a = document.createElement('a');
a.download = 'test.hssp';
const blob = new Blob([editor.toBuffer()], {
  type: 'application/octet-stream',
});
const url = URL.createObjectURL(blob);
a.href = url;
a.click();
URL.revokeObjectURL(url);
```

- Creating _multiple_ files:

**Note:** _This method can only be used if `editor.version` is 4 or higher. You also cannot create more files than bytes included._

```js
// Node
const bufs = editor.toBuffers(4);
fs.writeFileSync('test-part1.hssp', bufs[0]);
fs.writeFileSync('test-part2.hssp', bufs[1]);
fs.writeFileSync('test-part3.hssp', bufs[2]);
fs.writeFileSync('test-part4.hssp', bufs[3]);

// Web
editor.toBuffers(4).forEach((buf, i) => {
  const a = document.createElement('a');
  a.download = 'test-part' + (i + 1) + '.hssp';
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
});
```

#### Fetching metadata from HSSP file

Currently supports HSSP 1-5.

Fetching metadata is as simple as that:

```js
// Node
var meta = HSSP.metadata(fs.readFileSync('pictures.hssp')); // You can provide a password in a second parameter

// Web
document.querySelector('input[type=file]').onchange = async (ev) => {
  var meta = HSSP.metadata(await fileReadEventHandler(ev)); // You can provide a password in a second parameter
};
```

To see how the output looks like, look in the [docs](https://hssp.leox.dev/jsdoc/).

#### Optional parameters for creating files/folders

```js
const options = {
  hidden: false, // Is the file hidden?
  system: false, // Is the file a system file?
  enableBackup: true, // Enable this file for backups?
  forceBackup: false, // Should the file be backed up (for very important files)?
  readOnly: false, // Should be write operations disabled?
  isMainFile: false, // Is this the main file of the directory?

  permissions: 764, // rwxrw-r-- (chmod syntax)

  owner: 'user',
  group: 'users',
  created: new Date(1188518400000),
  changed: new Date(1188518400000),
  opened: new Date(1188518400000),
  webLink: 'https://leox.dev/projects/lora/logo.png', // A string containing a link to an exact same file on the web
};

editor.addFile(name, buf, options);
editor.addFolder(name, options);
```

#### Supported compression algorithms

- `DEFLATE`
- `LZMA`
- `NONE`

## [Docs (generated by JSDoc)](https://hssp.leox.dev/jsdoc/)

## Contributing

Feel free to contribute by [opening an issue](https://github.com/HSSPfile/js/issues/new/choose) and requesting new features, reporting bugs or just asking questions.

You can also [fork the repository](https://github.com/HSSPfile/js/fork) and open a [pull request](https://github.com/HSSPfile/js/pulls) after making some changes like fixing bugs.

## [License](LICENSE)

HSSP for JavaScript is licensed under MIT license.
