const wfldparse = require('./wfld-rfld-dhdr/parse');

const v = {
  1: {
    parse: wfldparse.parse,
  },
};

class Editor {}

module.exports = { Editor };
