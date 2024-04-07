const fs = require('fs');
const path = require('path');

const license = fs.readFileSync(path.join(__dirname, '../LICENSE'), 'utf8');

if (fs.existsSync(path.join(__dirname, '../dist/hssp.js'))) {
  fs.writeFileSync(
    path.join(__dirname, '../dist/hssp.js'),
    `// https://github.com/HSSPfile/js\n\n/*\n\n${license}\n*/\n\n\n\n${fs.readFileSync(
      path.join(__dirname, '../dist/hssp.js'),
      'utf8',
    )}`,
    'utf8',
  );
}

if (fs.existsSync(path.join(__dirname, '../dist/hssp.min.js'))) {
  fs.writeFileSync(
    path.join(__dirname, '../dist/hssp.min.js'),
    `// https://github.com/HSSPfile/js\n\n/*\n\n${license}\n*/\n\n\n\n${fs.readFileSync(
      path.join(__dirname, '../dist/hssp.min.js'),
      'utf8',
    )}`,
    'utf8',
  );
}

if (fs.existsSync(path.join(__dirname, '../dist/hssp-web.js'))) {
  fs.writeFileSync(
    path.join(__dirname, '../dist/hssp-web.js'),
    `// https://github.com/HSSPfile/js\n\n/*\n\n${license}\n*/\n\n\n\n${fs.readFileSync(
      path.join(__dirname, '../dist/hssp-web.js'),
      'utf8',
    )}`,
    'utf8',
  );
}

if (fs.existsSync(path.join(__dirname, '../dist/hssp-web.min.js'))) {
  fs.writeFileSync(
    path.join(__dirname, '../dist/hssp-web.min.js'),
    `// https://github.com/HSSPfile/js\n\n/*\n\n${license}\n*/\n\n\n\n${fs.readFileSync(
      path.join(__dirname, '../dist/hssp-web.min.js'),
      'utf8',
    )}`,
    'utf8',
  );
}
