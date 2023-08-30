var murmurhash = require('murmurhash-js');
var crypto = require('crypto');
var os = require('os');
var lzma = require('lzma');
var { deflate, inflate } = require('pako');

var compAlgos = { //> https://hssp.leox.dev/docs/compression/codes
    'DEFLATE': 'DFLT',
    'LZMA': 'LZMA'
};

class Editor { // Can hold massive amounts of data in a single file
    #files = [];
    #pwd = null;
    #compAlgo = 'NONE';
    #compLvl = 0;
    #comment = '';
    #ver = 5;
    #idx = 0;
    #enc = false;
    #cmp = false;

    /**
     * Creates a new editor
     * @since 1.0.0/v1
     */
    constructor() { }

    /**
     * Returns all included files
     * @returns {{[name: string]: {buffer: Buffer, options: {isFolder: boolean, hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}}}} All included files
     * 
     * @since 1.0.0/v1
     */
    get files() {
        var files = {};
        this.#files.forEach(file => files[file[0]] = {
            buffer: file[1],
            options: file[2]
        });
        return files;
    }

    /**
     * Adds a file to the editor
     * @param {string} name The name of the file to add
     * @param {Buffer} buffer The buffer of the file to add
     * @param {{hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string, encrypted: boolean, compressed: boolean}} [options] The options of the folder to add
     * 
     * @since 1.0.0/v1
     */
    addFile(name, buffer, options) {
        var options = options ?? {};
        options = {
            isFolder: false, // 0 - Is the file a folder?
            hidden: options.hidden ?? false, // 1 - Is the file hidden?
            system: options.system ?? false, // 2 - Is the file a system file?
            enableBackup: options.enableBackup ?? true, // 3 - Enable this file for backups?
            forceBackup: options.forceBackup ?? false, // 4 - Should the file be backed up (for very important files)?
            readOnly: options.readOnly ?? false, // 5 - Should be write operations disabled?
            mainFile: options.mainFile ?? false, // 6 - Is this the main file of the directory?

            size: buffer.length, // The size of the file in bytes

            permissions: options.permissions ?? 764, // rwxrw-r--

            owner: options.owner ?? os.userInfo().username,
            group: options.group ?? os.userInfo().gid.toString(36),
            created: options.created ?? new Date(),
            changed: options.changed ?? new Date(),
            opened: options.opened ?? new Date(),
            webLink: options.webLink ?? '', // A string containing a link to an exact same file on the web

            encrypted: options.encrypted ?? this.#pwd !== null,
            compressed: options.compressed ?? this.#compAlgo !== 'NONE'
        };
        (idx => this.#idx = options.mainFile ? idx : this.#idx)(this.#files.push([name, buffer, options]));
    }

    /**
     * Adds a folder to the editor
     * @param {string} name The name of the folder to add
     * @param {{hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}} [options] The options of the folder to add
     * 
     * @since 1.0.0/v1
     */
    addFolder(name, options) {
        var options = options ?? {};
        options = {
            isFolder: true, // 0 - Is the file a folder?
            hidden: options.hidden ?? false, // 1 - Is the file hidden?
            system: options.system ?? false, // 2 - Is the file a system file?
            enableBackup: options.enableBackup ?? true, // 3 - Enable this file for backups?
            forceBackup: options.forceBackup ?? false, // 4 - Should the file be backed up (for very important files)?
            readOnly: options.readOnly ?? false, // 5 - Should be write operations disabled?
            mainFile: options.mainFile ?? false, // 6 - Is this the main file of the directory?

            size: 0, // The size of the file in bytes

            permissions: options.permissions ?? 764, // rwxrw-r--

            owner: options.owner ?? os.userInfo().username,
            group: options.group ?? os.userInfo().gid.toString(36),
            created: options.created ?? new Date(),
            changed: options.changed ?? new Date(),
            opened: options.opened ?? new Date(),
            webLink: options.webLink ?? '', // A string containing a link to an exact same file on the web
        };
        (idx => this.#idx = options.mainFile ? idx : this.#idx)(this.#files.push([name, Buffer.alloc(0), options]));
    }

    /**
     * Removes a file or folder from the editor
     * @param {string} name The name of the file to remove
     * @returns {{buffer: Buffer, options: {isFolder: boolean, hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}}} The removed file
     * 
     * @since 1.0.0/v1
     * 
     * @throws {Error} "FILE_NOT_FOUND" if the file was not found
     */
    remove(name) {
        var idx = this.#files.findIndex(file => file[0] == name);
        if (idx == -1) throw new Error('FILE_NOT_FOUND');
        var file = this.#files.splice(idx, 1);
        return {
            buffer: file[1],
            options: file[2]
        };
    }

    /**
     * Sets the compression of the editor
     * @param {{algorithm: string, level: number}} val The compression to set
     * 
     * @since 3.0.0/v4
     */
    set compression(val) {
        this.#compAlgo = compAlgos[val.algorithm ?? 'NONE'] ? compAlgos[val.algorithm ?? 'NONE'] : 'NONE';
        this.#compLvl = val.level ?? 5;
    }

    /**
     * Returns the compression of the editor
     * @returns {{algorithm: string, level: number}} The compression of the editor
     * 
     * @since 3.0.0/v4
     */
    get compression() {
        return {
            algorithm: Object.keys(compAlgos).find(key => compAlgos[key] == this.#compAlgo),
            level: this.#compLvl
        };
    }

    /**
     * Sets the comment of the editor
     * @param {string} str The comment to set
     * 
     * @since 3.0.0/v4
     */
    set comment(str) {
        this.#comment = str.toString();
    }

    /**
     * Returns the comment of the editor
     * @returns {string} The comment of the editor
     * 
     * @since 3.0.0/v4
     */
    get comment() {
        return this.#comment;
    }

    /**
     * Sets the version of the editor
     * @param {number} int The version to set
     * 
     * @since 3.0.0/v4
     */
    set version(int) {
        this.#ver = +int < 6 && 0 < +int ? +int : this.#ver;
    }

    /**
     * Returns the version of the editor
     * @returns {number} The version of the editor
     * 
     * @since 3.0.0/v4
     */
    get version() {
        return this.#ver;
    }

    /**
     * Defines if the index should be encrypted
     * @param {boolean} bool The boolean
     * 
     * @since 5.0.0/v6
     */
    set encryptIndex(bool) {
        this.#enc = !!bool;
    }

    /**
     * Defines if the index should be encrypted
     * @returns {boolean} The boolean
     * 
     * @since 5.0.0/v6
     */
    get encryptIndex() {
        return this.#enc;
    }

    /**
     * Defines if the index should be compressed
     * @param {boolean} bool The boolean
     * 
     * @since 5.0.0/v6
     */
    set compressIndex(bool) {
        this.#cmp = !!bool;
    }

    /**
     * Defines if the index should be compressed
     * @returns {boolean} The boolean
     * 
     * @since 5.0.0/v6
     */
    get compressIndex() {
        return this.#cmp;
    }

    /**
     * Sets the password for the editor
     * @param {string | null} string The password to set
     * 
     * @since 1.0.0/v1
     */
    set password(string) {
        this.#pwd = string ?? null;
    }

    /**
     * Returns the password set for the editor
     * @since 3.0.0/v4
     * 
     * @throws {Error} "DUDE_A_PASSWORD_IS_PRIVATE" because you shouldn't get the password
     */
    get password() {
        throw new Error('DUDE_A_PASSWORD_IS_PRIVATE');
    }

    /**
     * Imports files from {buffer} into the Editor instance
     * @param {Buffer} buffer The HSSP buffer to import files from
     * @param {string} [password] The password to decrypt the file with (if encrypted)
     * 
     * @since 1.0.0/v1
     * 
     * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
     * @throws {Error} "INVALID_CHECKSUM" if the checksum of the HSSP buffer is invalid
     * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
     */
    import(buffer, password) {
        buffer = Buffer.from(buffer);
        password = `${password}`;
        if (buffer.subarray(0, 4).toString('utf8') == 'SFA\x00') { // v1: 0-4 SFA\x00, Uses 64B header
            var inp = buffer.subarray(64, buffer.byteLength);
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            if (buffer.readUint32LE(4) !== hash) throw new Error('INVALID_CHECKSUM');
            var fileCount = buffer.readUint32LE(8);
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) throw new Error('INVALID_PASSWORD');
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(64, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 64);
            };

            var offs = 64;
            var index = buffer.readUint32LE(60);
            this.#idx = index;
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = Number(buffer.readBigUint64LE(offs));
                this.#files.push([name, buffer.subarray(offs + 10 + nameLen, offs + 10 + nameLen + fileSize), {
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    size: fileSize,
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                }]);
                offs += 10 + nameLen * 2 + fileSize;
            };
            return;
        };

        if (buffer.readUint32LE(4) == murmurhash.murmur3(buffer.subarray(64, buffer.byteLength).toString('utf8'), 0x31082007) && !buffer.subarray(64, 128).equals(Buffer.alloc(64).fill(0))) { // v2: Uses 64B header
            var inp = buffer.subarray(64, buffer.byteLength);
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            if (buffer.readUint32LE(4) !== hash) throw new Error('INVALID_CHECKSUM');
            var fileCount = buffer.readUint32LE(8);
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) throw new Error('INVALID_PASSWORD');
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(64, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 64);
            };

            var offs = 64;
            var index = buffer.readUint32LE(60);
            this.#idx = index;
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = Number(buffer.readBigUint64LE(offs));
                this.#files.push([name, buffer.subarray(offs + 10 + nameLen, offs + 10 + nameLen + fileSize), {
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    size: fileSize,
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                }]);
                offs += 10 + nameLen * 2 + fileSize;
            };
            return;
        };

        if (buffer.subarray(64, 128).equals(Buffer.alloc(64).fill(0))) { // v3: Uses 128B header
            var inp = buffer.subarray(128, buffer.byteLength);
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            if (buffer.readUint32LE(4) !== hash) throw new Error('INVALID_CHECKSUM');
            var fileCount = buffer.readUint32LE(8);
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) throw new Error('INVALID_PASSWORD');
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(128, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 128);
            };

            var offs = 128;
            var index = buffer.readUint32LE(60);
            this.#idx = index;
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = Number(buffer.readBigUint64LE(offs));
                this.#files.push([name, buffer.subarray(offs + 10 + nameLen, offs + 10 + nameLen + fileSize), {
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    size: fileSize,
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                }]);
                offs += 10 + nameLen * 2 + fileSize;
            };
            return;
        };

        switch (buffer.readUint8(4)) {
            case 4: // v4: Uses 128B header completely + indexing
                var inp = buffer.subarray(128, buffer.byteLength);
                var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
                if (buffer.readUint32LE(64) !== hash) throw new Error('INVALID_CHECKSUM');
                var fileCount = buffer.readUint32LE(8);
                if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                    if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) throw new Error('INVALID_PASSWORD');
                    var iv = buffer.subarray(44, 60);
                    var encrypted = buffer.subarray(128, buffer.byteLength);
                    var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                    var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                    decrypted.copy(buffer, 128);
                };

                var offs = 128;

                switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(inflate(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    case 'LZMA':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(lzma.decompress(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    case 'NONE':
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };

                var files = [];
                for (var i = 0; i < fileCount; i++) {
                    var file = [];
                    file[2] = {};

                    var innerOffs = 0;
                    file[1] = buffer.readBigUint64LE(offs);
                    file[2].size = file[1];
                    offs += innerOffs + 8;

                    var innerOffs = buffer.readUint16LE(offs);
                    file[0] = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].owner = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].group = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint32LE(offs);
                    file[2].webLink = buffer.toString('utf8', offs + 4, offs + 4 + innerOffs);
                    offs += innerOffs + 4;

                    file[2].created = new Date(buffer.readUintLE(offs, 6));
                    file[2].changed = new Date(buffer.readUintLE(offs + 6, 6));
                    file[2].opened = new Date(buffer.readUintLE(offs + 12, 6));
                    offs += 18;

                    var permissions = '';
                    for (var j = 0; j < 9; j++) {
                        permissions += (buffer[offs + Math.floor(j / 8)] >> j % 8) & 1;
                    };
                    file[2].permissions = +parseInt(permissions, 2).toString(8);

                    file[2].isFolder = !!((buffer[offs + 1] >> 1) & 1);
                    file[2].hidden = !!((buffer[offs + 1] >> 2) & 1);
                    file[2].system = !!((buffer[offs + 1] >> 3) & 1);
                    file[2].enableBackup = !!((buffer[offs + 1] >> 4) & 1);
                    file[2].forceBackup = !!((buffer[offs + 1] >> 5) & 1);
                    file[2].readOnly = !!((buffer[offs + 1] >> 6) & 1);
                    file[2].mainFile = !!((buffer[offs + 1] >> 7) & 1);
                    offs += 2;

                    files.push(file);
                };

                var splitFileOffset = Number(buffer.readBigUint64LE(76));
                if (splitFileOffset > 0) {
                    var file = files.shift();

                    var fileStart = offs;
                    offs += Number(file[1]) - splitFileOffset;
                    var fileEnd = offs;
                    file[1] = buffer.subarray(fileStart, fileEnd);

                    var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                    if (idx == -1) {
                        file[1] = Buffer.concat([Buffer.alloc(splitFileOffset), file[1]]);
                        this.#files.push(file);
                    } else {
                        file[1].copy(this.#files[idx][1], splitFileOffset, 0);
                    };
                };

                files.forEach((file) => {
                    var fileStart = offs;
                    offs += Number(file[1]);
                    var fileEnd = offs;
                    file[1] = buffer.subarray(fileStart, fileEnd);

                    if (offs > buffer.byteLength) {
                        var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                        if (idx == -1) {
                            file[1] = Buffer.concat([file[1], Buffer.alloc(offs - buffer.byteLength)]);
                            this.#files.push(file);
                        } else {
                            file[1].copy(this.#files[idx][1], 0, 0);
                        };
                    } else {
                        this.#files.push(file);
                    };
                });
                return;

            case 5: // v5: Uses flags
                var inp = buffer.subarray(128, buffer.byteLength);
                var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
                if (buffer.readUint32LE(64) !== hash) throw new Error('INVALID_CHECKSUM');
                var fileCount = buffer.readUint32LE(8);
                var flags = [];
                buffer.readUint8(5).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));
                buffer.readUint8(6).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));
                buffer.readUint8(7).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));
                if (flags[0]) { // check if file is encrypted
                    if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) throw new Error('INVALID_PASSWORD');
                    var iv = buffer.subarray(44, 60);
                    var encrypted = buffer.subarray(128, buffer.byteLength);
                    var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                    var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                    decrypted.copy(buffer, 128);
                };

                var offs = 128;

                if (flags[1]) switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(inflate(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    case 'LZMA':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(lzma.decompress(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };

                var files = [];
                for (var i = 0; i < fileCount; i++) {
                    var file = [];
                    file[2] = {};

                    var innerOffs = 0;
                    file[1] = buffer.readBigUint64LE(offs);
                    file[2].size = file[1];
                    offs += innerOffs + 8;

                    var innerOffs = buffer.readUint16LE(offs);
                    file[0] = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].owner = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].group = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint32LE(offs);
                    file[2].webLink = buffer.toString('utf8', offs + 4, offs + 4 + innerOffs);
                    offs += innerOffs + 4;

                    file[2].created = new Date(buffer.readUintLE(offs, 6));
                    file[2].changed = new Date(buffer.readUintLE(offs + 6, 6));
                    file[2].opened = new Date(buffer.readUintLE(offs + 12, 6));
                    offs += 18;

                    var permissions = '';
                    for (var j = 0; j < 9; j++) {
                        permissions += (buffer[offs + Math.floor(j / 8)] >> j % 8) & 1;
                    };
                    file[2].permissions = +parseInt(permissions, 2).toString(8);

                    file[2].isFolder = !!((buffer[offs + 1] >> 1) & 1);
                    file[2].hidden = !!((buffer[offs + 1] >> 2) & 1);
                    file[2].system = !!((buffer[offs + 1] >> 3) & 1);
                    file[2].enableBackup = !!((buffer[offs + 1] >> 4) & 1);
                    file[2].forceBackup = !!((buffer[offs + 1] >> 5) & 1);
                    file[2].readOnly = !!((buffer[offs + 1] >> 6) & 1);
                    file[2].mainFile = !!((buffer[offs + 1] >> 7) & 1);
                    offs += 2;

                    files.push(file);
                };

                if (flags[2]) {
                    var splitFileOffset = Number(buffer.readBigUint64LE(76));
                    if (splitFileOffset > 0) {
                        var file = files.shift();

                        var fileStart = offs;
                        offs += Number(file[1]) - splitFileOffset;
                        var fileEnd = offs;
                        file[1] = buffer.subarray(fileStart, fileEnd);

                        var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                        if (idx == -1) {
                            file[1] = Buffer.concat([Buffer.alloc(splitFileOffset), file[1]]);
                            this.#files.push(file);
                        } else {
                            file[1].copy(this.#files[idx][1], splitFileOffset, 0);
                        };
                    };

                    files.forEach((file) => {
                        var fileStart = offs;
                        offs += Number(file[1]);
                        var fileEnd = offs;
                        file[1] = buffer.subarray(fileStart, fileEnd);

                        if (offs > buffer.byteLength) {
                            var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                            if (idx == -1) {
                                file[1] = Buffer.concat([file[1], Buffer.alloc(offs - buffer.byteLength)]);
                                this.#files.push(file);
                            } else {
                                file[1].copy(this.#files[idx][1], 0, 0);
                            };
                        } else {
                            this.#files.push(file);
                        };
                    });
                };
                return;

            default:
                throw new Error('VERSION_NOT_SUPPORTED');
        };
    }

    /**
     * Creates a HSSP buffer
     * @returns {Buffer} The buffer
     * 
     * @since 1.0.0/v1
     * 
     * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
     * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
     */
    toBuffer() {
        switch (this.#ver) {
            case 1:
                var size = 64; // Bytes
                this.#files.forEach(file => {
                    size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                });
                var out = Buffer.alloc(size);
                out.write('SFA\x00', 0, 'utf8'); // Magic value :) | 4+0
                out.writeUint32LE(this.#files.length, 8); // File count | 4+8
                for (var i = 3; i < 11; i++) {
                    out.writeUint32LE(0, i * 4); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var i = 0; i < 4; i++) {
                    out.writeUint32LE(0, i * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                out.writeUint32LE(this.#idx, 60); // Index file number, 0 if not set | 4+60
                var offs = 64; // Start
                this.#files.forEach(file => {
                    out.writeBigUint64LE(BigInt(file[1].byteLength), offs); // file size (up to 16 EiB!!!)
                    out.writeUint16LE((new TextEncoder().encode(file[0])).byteLength, offs + 8); // name size
                    out.write(file[0], offs + 10, 'utf8'); // name
                    file[1].copy(out, offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                    offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                });
                var pack = out.subarray(64, size);
                if (this.#pwd !== null) {
                    var iv = crypto.randomBytes(16);
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                    iv.copy(out, 44);
                    encrypted.copy(out, 64);
                    crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(out, 12);
                    var eOut = Buffer.concat([out.subarray(0, 64), encrypted]);
                    eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 4);
                    return eOut;
                };
                out.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 4); // checksum
                return out;
            case 2:
                var size = 64; // Bytes
                this.#files.forEach(file => {
                    size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                });
                var out = Buffer.alloc(size);
                out.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                out.writeUint32LE(this.#files.length, 8); // File count | 4+8
                for (var i = 3; i < 11; i++) {
                    out.writeUint32LE(0, i * 4); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var i = 0; i < 4; i++) {
                    out.writeUint32LE(0, i * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                out.writeUint32LE(this.#idx, 60); // Index file number, 0 if not set | 4+60
                var offs = 64; // Start
                this.#files.forEach(file => {
                    out.writeBigUint64LE(BigInt(file[1].byteLength), offs); // file size (up to 16 EiB!!!)
                    out.writeUint16LE((new TextEncoder().encode(file[0])).byteLength, offs + 8); // name size
                    out.write(file[0], offs + 10, 'utf8'); // name
                    file[1].copy(out, offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                    offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                });
                var pack = out.subarray(64, size);
                if (this.#pwd !== null) {
                    var iv = crypto.randomBytes(16);
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                    iv.copy(out, 44);
                    encrypted.copy(out, 64);
                    crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(out, 12);
                    var eOut = Buffer.concat([out.subarray(0, 64), encrypted]);
                    eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 4);
                    return eOut;
                };
                out.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 4); // checksum
                return out;
            case 3:
                var size = 128; // Bytes
                this.#files.forEach(file => {
                    size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                });
                var out = Buffer.alloc(size);
                out.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                out.writeUint32LE(this.#files.length, 8); // File count | 4+8
                for (var i = 3; i < 11; i++) {
                    out.writeUint32LE(0, i * 4); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var i = 0; i < 4; i++) {
                    out.writeUint32LE(0, i * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                out.writeUint32LE(this.#idx, 60); // Index file number, 0 if not set | 4+60
                // 64 bytes unallocated yet
                var offs = 128; // Start
                this.#files.forEach(file => {
                    out.writeBigUint64LE(BigInt(file[1].byteLength), offs); // file size (up to 16 EiB!!!)
                    out.writeUint16LE((new TextEncoder().encode(file[0])).byteLength, offs + 8); // name size
                    out.write(file[0], offs + 10, 'utf8'); // name
                    file[1].copy(out, offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                    offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                });
                var pack = out.subarray(128, size);
                if (this.#pwd !== null) {
                    var iv = crypto.randomBytes(16);
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                    iv.copy(out, 44);
                    encrypted.copy(out, 128);
                    crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(out, 12);
                    var eOut = Buffer.concat([out.subarray(0, 128), encrypted]);
                    eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 4);
                    return eOut;
                };
                out.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 4); // checksum
                return out;
            case 4:
                var size = 128; // Bytes
                this.#files.forEach(file => size +=
                    38 + // various constants

                    (new TextEncoder().encode(file[0])).byteLength + // File name length
                    (new TextEncoder().encode(file[2].owner)).byteLength + // Owner name length
                    (new TextEncoder().encode(file[2].group)).byteLength + // Group name length
                    (new TextEncoder().encode(file[2].webLink)).byteLength + // Web link length

                    file[1].byteLength
                );
                var out = Buffer.alloc(size);
                out.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                out.writeUint8(4, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                // these 3 bytes are reserved for future use | 3+5
                out.writeUint32LE(this.#files.length, 8); // File count | 4+8
                for (var i = 3; i < 11; i++) {
                    out.writeUint32LE(0, i * 4); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var i = 0; i < 4; i++) {
                    out.writeUint32LE(0, i * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                out.write(this.#compAlgo, 60, 'utf8'); // Used compression algorithm, 0 if not set | 4+60
                // this file is not split | 28+68
                out.write(this.#comment.slice(0, 16), 96, 'utf8'); // Comment | 16+96
                out.write('hssp 4.0.1 @ npm', 112, 'utf8'); // Used generator | 16+112

                var offs = 128; // Start

                // index
                this.#files.forEach(file => {
                    var innerOffs = 0;
                    out.writeBigUint64LE(BigInt(file[1].byteLength), offs);
                    offs += innerOffs + 8;

                    innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[0], offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[2].owner, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[2].group, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                    out.writeUint32LE(innerOffs, offs);
                    out.write(file[2].webLink, offs + 4, 'utf8');
                    offs += innerOffs + 4;

                    out.writeUintLE(file[2].created.getTime(), offs, 6);
                    out.writeUintLE(file[2].changed.getTime(), offs + 6, 6);
                    out.writeUintLE(file[2].opened.getTime(), offs + 12, 6);
                    offs += 18;

                    parseInt(file[2].permissions, 8).toString(2).split('').map(x => parseInt(x)).forEach((bit, addr) => {
                        out[offs + Math.floor(addr / 8)] |= (bit << addr);
                    });
                    out[offs + 1] |= (+!!file[2].isFolder << 1);
                    out[offs + 1] |= (+!!file[2].hidden << 2);
                    out[offs + 1] |= (+!!file[2].system << 3);
                    out[offs + 1] |= (+!!file[2].enableBackup << 4);
                    out[offs + 1] |= (+!!file[2].forceBackup << 5);
                    out[offs + 1] |= (+!!file[2].readOnly << 6);
                    out[offs + 1] |= (+!!file[2].mainFile << 7);
                    offs += 2;
                });

                // files
                this.#files.forEach(file => {
                    file[1].copy(out, offs); // file
                    offs += file[1].byteLength;
                });
                var outBuf = out;
                var pack = outBuf.subarray(128, size);

                switch (this.#compAlgo) {
                    case 'DFLT':
                        outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(deflate(pack, { level: this.#compLvl }))]);
                        break;

                    case 'LZMA':
                        outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(lzma.compress(pack, this.#compLvl))]);
                        break;

                    case 'NONE':
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };

                size = outBuf.byteLength;
                pack = outBuf.subarray(128, size);

                if (this.#pwd !== null) {
                    var iv = crypto.randomBytes(16);
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                    iv.copy(outBuf, 44);
                    encrypted.copy(outBuf, 128);
                    crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(outBuf, 12);
                    var eOut = Buffer.concat([outBuf.subarray(0, 128), encrypted]);
                    eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 64);
                    return eOut;
                };
                outBuf.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 64); // checksum
                return outBuf;
            case 5:
                var size = 128; // Bytes
                this.#files.forEach(file => size +=
                    38 + // various constants

                    (new TextEncoder().encode(file[0])).byteLength + // File name length
                    (new TextEncoder().encode(file[2].owner)).byteLength + // Owner name length
                    (new TextEncoder().encode(file[2].group)).byteLength + // Group name length
                    (new TextEncoder().encode(file[2].webLink)).byteLength + // Web link length

                    file[1].byteLength
                );
                var out = Buffer.alloc(size);
                out.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                out.writeUint8(5, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                out.writeUint8(parseInt([
                    this.#pwd !== null, // F1: is encrypted
                    this.#compAlgo !== 'NONE', // F2: is compressed
                    false, // F3: is split
                    false, // F4: unallocated
                    false, // F5: unallocated
                    false, // F6: unallocated
                    false, // F7: unallocated
                    false // F8: unallocated
                ].map(b => +b).join(''), 2), 5); // Flags #1, see https://hssp.leox.dev/docs/flags | 1+5
                out.writeUint8(parseInt([
                    false, // F9: unallocated
                    false, // F10: unallocated
                    false, // F11: unallocated
                    false, // F12: unallocated
                    false, // F13: unallocated
                    false, // F14: unallocated
                    false, // F15: unallocated
                    false // F16: unallocated
                ].map(b => +b).join(''), 2), 6); // Flags #2, see https://hssp.leox.dev/docs/flags | 1+6
                out.writeUint8(parseInt([
                    false, // F17: unallocated
                    false, // F18: unallocated
                    false, // F19: unallocated
                    false, // F20: unallocated
                    false, // F21: unallocated
                    false, // F22: unallocated
                    false, // F23: unallocated
                    false // F24: unallocated
                ].map(b => +b).join(''), 2), 7); // Flags #3, see https://hssp.leox.dev/docs/flags | 1+7
                out.writeUint32LE(this.#files.length, 8); // File count | 4+8
                for (var i = 3; i < 11; i++) {
                    out.writeUint32LE(0, i * 4); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var i = 0; i < 4; i++) {
                    out.writeUint32LE(0, i * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                out.write(this.#compAlgo, 60, 'utf8'); // Used compression algorithm, NONE if not set | 4+60
                // this file is not split | 28+68
                out.write(this.#comment.slice(0, 16), 96, 'utf8'); // Comment | 16+96
                out.write('hssp 4.0.1 @ npm', 112, 'utf8'); // Used generator | 16+112

                var offs = 128; // Start

                // index
                this.#files.forEach(file => {
                    var innerOffs = 0;
                    out.writeBigUint64LE(BigInt(file[1].byteLength), offs);
                    offs += innerOffs + 8;

                    innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[0], offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[2].owner, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                    out.writeUint16LE(innerOffs, offs);
                    out.write(file[2].group, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                    out.writeUint32LE(innerOffs, offs);
                    out.write(file[2].webLink, offs + 4, 'utf8');
                    offs += innerOffs + 4;

                    out.writeUintLE(file[2].created.getTime(), offs, 6);
                    out.writeUintLE(file[2].changed.getTime(), offs + 6, 6);
                    out.writeUintLE(file[2].opened.getTime(), offs + 12, 6);
                    offs += 18;

                    parseInt(file[2].permissions, 8).toString(2).split('').map(x => parseInt(x)).forEach((bit, addr) => {
                        out[offs + Math.floor(addr / 8)] |= (bit << addr);
                    });
                    out[offs + 1] |= (+!!file[2].isFolder << 1);
                    out[offs + 1] |= (+!!file[2].hidden << 2);
                    out[offs + 1] |= (+!!file[2].system << 3);
                    out[offs + 1] |= (+!!file[2].enableBackup << 4);
                    out[offs + 1] |= (+!!file[2].forceBackup << 5);
                    out[offs + 1] |= (+!!file[2].readOnly << 6);
                    out[offs + 1] |= (+!!file[2].mainFile << 7);
                    offs += 2;
                });

                // files
                this.#files.forEach(file => {
                    file[1].copy(out, offs); // file
                    offs += file[1].byteLength;
                });
                var outBuf = out;
                var pack = outBuf.subarray(128, size);

                switch (this.#compAlgo) {
                    case 'DFLT':
                        outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(deflate(pack, { level: this.#compLvl }))]);
                        break;

                    case 'LZMA':
                        outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(lzma.compress(pack, this.#compLvl))]);
                        break;

                    case 'NONE':
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };

                size = outBuf.byteLength;
                pack = outBuf.subarray(128, size);

                if (this.#pwd !== null) {
                    var iv = crypto.randomBytes(16);
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                    iv.copy(outBuf, 44);
                    encrypted.copy(outBuf, 128);
                    crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(outBuf, 12);
                    var eOut = Buffer.concat([outBuf.subarray(0, 128), encrypted]);
                    eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 64);
                    return eOut;
                };
                outBuf.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 64); // checksum
                return outBuf;
            case 6:
                var headerSize = 128; // Bytes
                var indexSize = 0;
                var filesSize = 0;
                this.#files.forEach(file => {
                    indexSize += (
                        39 + // various constants

                        (new TextEncoder().encode(file[0])).byteLength + // File name length
                        (new TextEncoder().encode(file[2].owner)).byteLength + // Owner name length
                        (new TextEncoder().encode(file[2].group)).byteLength + // Group name length
                        (new TextEncoder().encode(file[2].webLink)).byteLength // Web link length
                    );

                    filesSize = file[1].byteLength;
                });
                var iv = crypto.randomBytes(16);
                var header = Buffer.alloc(headerSize);
                header.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                header.writeUint8(5, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                header.writeUint8(parseInt([
                    this.#enc, // F1: is encrypted
                    this.#cmp, // F2: is compressed
                    false, // F3: is split
                    false, // F4: unallocated
                    false, // F5: unallocated
                    false, // F6: unallocated
                    false, // F7: unallocated
                    false // F8: unallocated
                ].map(b => +b).join(''), 2), 5); // Flags #1, see https://hssp.leox.dev/docs/flags | 1+5
                header.writeUint8(parseInt([
                    false, // F9: unallocated
                    false, // F10: unallocated
                    false, // F11: unallocated
                    false, // F12: unallocated
                    false, // F13: unallocated
                    false, // F14: unallocated
                    false, // F15: unallocated
                    false // F16: unallocated
                ].map(b => +b).join(''), 2), 6); // Flags #2, see https://hssp.leox.dev/docs/flags | 1+6
                header.writeUint8(parseInt([
                    false, // F17: unallocated
                    false, // F18: unallocated
                    false, // F19: unallocated
                    false, // F20: unallocated
                    false, // F21: unallocated
                    false, // F22: unallocated
                    false, // F23: unallocated
                    false // F24: unallocated
                ].map(b => +b).join(''), 2), 7); // Flags #3, see https://hssp.leox.dev/docs/flags | 1+7
                header.writeUint32LE(this.#files.length, 8); // File count | 4+8
                crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(header, 12); // Password hash | 32+12
                iv.copy(outBuf, 44); // Encryption initialization vector (iv) | 16+44
                header.write(this.#compAlgo, 60, 'utf8'); // Used compression algorithm, NONE if not set | 4+60
                // this file is not split | 28+68
                header.write(this.#comment.slice(0, 16), 96, 'utf8'); // Comment | 16+96
                header.write('hssp 5.0.0 @ npm', 112, 'utf8'); // Used generator | 16+112

                var index = Buffer.alloc(indexSize);
                var offs = 0; // Start
                var checksumOffsets = [];

                // index
                this.#files.forEach(file => {
                    var innerOffs = 0;
                    index.writeBigUint64LE(BigInt(file[1].byteLength), offs);
                    offs += innerOffs + 8;

                    innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                    index.writeUint16LE(innerOffs, offs);
                    index.write(file[0], offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                    index.writeUint16LE(innerOffs, offs);
                    index.write(file[2].owner, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                    index.writeUint16LE(innerOffs, offs);
                    index.write(file[2].group, offs + 2, 'utf8');
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                    index.writeUint32LE(innerOffs, offs);
                    index.write(file[2].webLink, offs + 4, 'utf8');
                    offs += innerOffs + 4;

                    index.writeUintLE(file[2].created.getTime(), offs, 6);
                    index.writeUintLE(file[2].changed.getTime(), offs + 6, 6);
                    index.writeUintLE(file[2].opened.getTime(), offs + 12, 6);
                    offs += 18;

                    parseInt(file[2].permissions, 8).toString(2).split('').map(x => parseInt(x)).forEach((bit, addr) => {
                        index[offs + Math.floor(addr / 8)] |= (bit << addr);
                    });
                    index[offs + 1] |= (+!!file[2].isFolder << 1);
                    index[offs + 1] |= (+!!file[2].hidden << 2);
                    index[offs + 1] |= (+!!file[2].system << 3);
                    index[offs + 1] |= (+!!file[2].enableBackup << 4);
                    index[offs + 1] |= (+!!file[2].forceBackup << 5);
                    index[offs + 1] |= (+!!file[2].readOnly << 6);
                    index[offs + 1] |= (+!!file[2].mainFile << 7);
                    index[offs + 2] |= (+!!file[2].encrypted << 0);
                    index[offs + 2] |= (+!!file[2].compressed << 1);
                    // 6 unallocated bits

                    checksumOffsets.push(offs + 3);
                    // 4 bytes reserved for checksum
                    offs += 7;
                });

                if (this.#cmp) switch (this.#compAlgo) {
                    case 'DFLT':
                        index = Buffer.from(deflate(index, { level: this.#compLvl }));
                        break;

                    case 'LZMA':
                        index = Buffer.from(lzma.compress(index, this.#compLvl));
                        break;

                    case 'NONE':
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };
                indexSize = index.byteLength;

                if (this.#enc) {
                    var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                    index = Buffer.concat([cipher.update(index), cipher.final()]);
                };
                indexSize = index.byteLength;
                header.writeUint32LE(murmurhash.murmur3(index.toString('utf8'), 0x31082007), 64); // checksum

                // files
                var files = [];
                this.#files.forEach(file => {
                    var newByteLength = file[1].byteLength;
                    files.push((cFile) => file[2].encrypted ? (() => {
                        var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                        return encrypted = Buffer.concat([cipher.update(cFile), cipher.final()]);
                    })() : cFile)((file[2].compressed ? (() => {
                        switch (this.#compAlgo) {
                            case 'DFLT':
                                var cFile = Buffer.from(deflate(file[1], { level: this.#compLvl }));
                                newByteLength = cFile.byteLength;
                                return cFile;

                            case 'LZMA':
                                var cFile = Buffer.from(lzma.compress(file[1], this.#compLvl));
                                newByteLength = cFile.byteLength;
                                return cFile;

                            case 'NONE':
                                return file[1];

                            default:
                                throw new Error('COMPRESSION_NOT_SUPPORTED');
                        };
                    })() : file[1])) // file
                });
                files.forEach((file, i) => index.writeUint32LE(murmurhash.murmur3(file.toString('utf8'), 0x31082007), checksumOffsets[i]));
                var files = Buffer.concat(files);

                var out = Buffer.concat([header, index, files]);
                return out;
            default:
                throw new Error('VERSION_NOT_SUPPORTED');
        };
    }

    /**
     * Creates {count} HSSP buffers
     * @param {Number} count The amount of buffers to split the file into
     * @returns {Buffer[]} The buffers
     * 
     * @since 3.0.0/v4
     * 
     * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
     * @throws {Error} "DUDE_YOU_CANNOT_SPLIT_A_FILE_INTO_LESS_THAN_ONE_PART" if the count is less than 1
     * @throws {Error} "DUDE_YOU_CANNOT_SPLIT_SOMETHING_THAT_IS_NOT_THERE" if there are no files to split
     * @throws {Error} "TOO_MANY_FILES" if the total byte length of the package is smaller than the count
     * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
     */
    toBuffers(count) {
        if (this.#ver !== 4 || this.#ver !== 5) throw new Error('VERSION_NOT_SUPPORTED');
        if (count < 1) throw new Error('DUDE_YOU_CANNOT_SPLIT_A_FILE_INTO_LESS_THAN_ONE_PART');
        if (this.#files.length < 1) throw new Error('DUDE_YOU_CANNOT_SPLIT_SOMETHING_THAT_IS_NOT_THERE');
        if ((() => {
            var size = 0;
            this.#files.forEach(file => size += file[2].size);
            return size <= count;
        })()) throw new Error('TOO_MANY_FILES');
        var offsets = [];
        var lengths = [];
        var bufferPool = Buffer.alloc(0);

        this.#files.forEach(file => {
            offsets.push(bufferPool.byteLength);
            lengths.push(file[1].byteLength);
            bufferPool = Buffer.concat([bufferPool, file[1]]);
        });

        var globalOffs = 0;
        var out = [];

        var avgSize = Math.floor(bufferPool.byteLength / count);

        for (var i = 0; i < count; i++) {
            var filesInBuffer = [];

            out[i] = Buffer.alloc(avgSize + (i == 0 ? bufferPool.byteLength % count : 0));
            bufferPool.copy(out[i], 0, globalOffs, globalOffs + out[i].byteLength);
            globalOffs += out[i].byteLength;

            for (var j = 0; j < this.#files.length; j++) {
                if (offsets[j] >= globalOffs) continue;
                if (offsets[j] + lengths[j] <= globalOffs - out[i].byteLength) continue;
                filesInBuffer.push([this.#files[j][0], offsets[j] - (globalOffs - out[i].byteLength), lengths[j], j]);
            };

            switch (this.#ver) {
                case 4:
                    var size = 128; // Bytes
                    filesInBuffer.forEach(file => size +=
                        38 + // various constants

                        (new TextEncoder().encode(this.#files[file[3]][0])).byteLength + // File name length
                        (new TextEncoder().encode(this.#files[file[3]][2].owner)).byteLength + // Owner name length
                        (new TextEncoder().encode(this.#files[file[3]][2].group)).byteLength + // Group name length
                        (new TextEncoder().encode(this.#files[file[3]][2].webLink)).byteLength // Web link length
                    );
                    var fileStart = Buffer.alloc(size);
                    fileStart.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                    fileStart.writeUint8(4, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                    // these 3 bytes are reserved for future use | 3+5
                    fileStart.writeUint32LE(filesInBuffer.length, 8); // File count | 4+8
                    for (var j = 3; j < 11; j++) {
                        fileStart.writeUint32LE(0, j * 4); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var j = 0; j < 4; j++) {
                        fileStart.writeUint32LE(0, j * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    fileStart.write(this.#compAlgo, 60, 'utf8'); // Used compression algorithm, 0 if not set | 4+60

                    fileStart.writeBigUint64LE(BigInt(this.#files.length), 68); // total file count | 8+68
                    fileStart.writeBigUint64LE(BigInt(filesInBuffer[0][1] <= 0 ? Math.abs(filesInBuffer[0][1]) : 0), 76); // split file offset | 8+76
                    if (out[i - 1]) fileStart.writeUint32LE(murmurhash.murmur3(out[i - 1].subarray(128, out[i - 1].byteLength).toString('utf8'), 0x31082007), 84); // Checksum of previous package | 4+84
                    fileStart.writeUint32LE(0, 88); // Checksum of next package | 4+88
                    fileStart.writeUint32LE(i, 92); // File ID of this package | 4+92

                    fileStart.write(this.#comment.slice(0, 16), 96, 'utf8'); // Comment | 16+96
                    fileStart.write('hssp 4.0.1 @ npm', 112, 'utf8'); // Used generator | 16+112

                    var offs = 128; // Start

                    // index
                    filesInBuffer.forEach(file => {
                        file = this.#files[file[3]];
                        var innerOffs = 0;
                        fileStart.writeBigUint64LE(BigInt(file[1].byteLength), offs);
                        offs += innerOffs + 8;

                        innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[0], offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[2].owner, offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[2].group, offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                        fileStart.writeUint32LE(innerOffs, offs);
                        fileStart.write(file[2].webLink, offs + 4, 'utf8');
                        offs += innerOffs + 4;

                        fileStart.writeUintLE(file[2].created.getTime(), offs, 6);
                        fileStart.writeUintLE(file[2].changed.getTime(), offs + 6, 6);
                        fileStart.writeUintLE(file[2].opened.getTime(), offs + 12, 6);
                        offs += 18;

                        parseInt(file[2].permissions, 8).toString(2).split('').map(x => parseInt(x)).forEach((bit, addr) => {
                            fileStart[offs + Math.floor(addr / 8)] |= (bit << addr);
                        });
                        fileStart[offs + 1] |= (+!!file[2].isFolder << 1);
                        fileStart[offs + 1] |= (+!!file[2].hidden << 2);
                        fileStart[offs + 1] |= (+!!file[2].system << 3);
                        fileStart[offs + 1] |= (+!!file[2].enableBackup << 4);
                        fileStart[offs + 1] |= (+!!file[2].forceBackup << 5);
                        fileStart[offs + 1] |= (+!!file[2].readOnly << 6);
                        fileStart[offs + 1] |= (+!!file[2].mainFile << 7);
                        offs += 2;
                    });

                    out[i] = Buffer.concat([fileStart, out[i]]);
                    var outBuf = out[i];
                    var pack = outBuf.subarray(128, outBuf.byteLength);

                    switch (this.#compAlgo) {
                        case 'DFLT':
                            outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(deflate(pack, { level: this.#compLvl }))]);
                            break;

                        case 'LZMA':
                            outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(lzma.compress(pack, this.#compLvl))]);
                            break;

                        case 'NONE':
                            break;

                        default:
                            throw new Error('COMPRESSION_NOT_SUPPORTED');
                    };

                    size = outBuf.byteLength;
                    pack = outBuf.subarray(128, size);

                    if (this.#pwd !== null) {
                        var iv = crypto.randomBytes(16);
                        var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                        var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                        iv.copy(outBuf, 44);
                        encrypted.copy(outBuf, 128);
                        crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(outBuf, 12);
                        var eOut = Buffer.concat([outBuf.subarray(0, 128), encrypted]);
                        eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 64);
                        out[i] = eOut;
                    } else {
                        outBuf.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 64);
                        out[i] = outBuf;
                    };
                    break;
                case 5:
                    var size = 128; // Bytes
                    filesInBuffer.forEach(file => size +=
                        38 + // various constants

                        (new TextEncoder().encode(this.#files[file[3]][0])).byteLength + // File name length
                        (new TextEncoder().encode(this.#files[file[3]][2].owner)).byteLength + // Owner name length
                        (new TextEncoder().encode(this.#files[file[3]][2].group)).byteLength + // Group name length
                        (new TextEncoder().encode(this.#files[file[3]][2].webLink)).byteLength // Web link length
                    );
                    var fileStart = Buffer.alloc(size);
                    fileStart.write('HSSP', 0, 'utf8'); // Magic value :) | 4+0
                    fileStart.writeUint8(4, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                    fileStart.writeUint8(parseInt([
                        this.#pwd !== null, // F1: is encrypted
                        this.#compAlgo !== 'NONE', // F2: is compressed
                        true, // F3: is split
                        false, // F4: unallocated
                        false, // F5: unallocated
                        false, // F6: unallocated
                        false, // F7: unallocated
                        false // F8: unallocated
                    ].map(b => +b).join(''), 2), 5); // Flags #1, see https://hssp.leox.dev/docs/flags | 1+5
                    fileStart.writeUint8(parseInt([
                        false, // F9: unallocated
                        false, // F10: unallocated
                        false, // F11: unallocated
                        false, // F12: unallocated
                        false, // F13: unallocated
                        false, // F14: unallocated
                        false, // F15: unallocated
                        false // F16: unallocated
                    ].map(b => +b).join(''), 2), 6); // Flags #2, see https://hssp.leox.dev/docs/flags | 1+6
                    fileStart.writeUint8(parseInt([
                        false, // F17: unallocated
                        false, // F18: unallocated
                        false, // F19: unallocated
                        false, // F20: unallocated
                        false, // F21: unallocated
                        false, // F22: unallocated
                        false, // F23: unallocated
                        false // F24: unallocated
                    ].map(b => +b).join(''), 2), 7); // Flags #3, see https://hssp.leox.dev/docs/flags | 1+7
                    fileStart.writeUint32LE(filesInBuffer.length, 8); // File count | 4+8
                    for (var j = 3; j < 11; j++) {
                        fileStart.writeUint32LE(0, j * 4); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var j = 0; j < 4; j++) {
                        fileStart.writeUint32LE(0, j * 4 + 44); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    fileStart.write(this.#compAlgo, 60, 'utf8'); // Used compression algorithm, 0 if not set | 4+60

                    fileStart.writeBigUint64LE(BigInt(this.#files.length), 68); // total file count | 8+68
                    fileStart.writeBigUint64LE(BigInt(filesInBuffer[0][1] <= 0 ? Math.abs(filesInBuffer[0][1]) : 0), 76); // split file offset | 8+76
                    if (out[i - 1]) fileStart.writeUint32LE(murmurhash.murmur3(out[i - 1].subarray(128, out[i - 1].byteLength).toString('utf8'), 0x31082007), 84); // Checksum of previous package | 4+84
                    fileStart.writeUint32LE(0, 88); // Checksum of next package | 4+88
                    fileStart.writeUint32LE(i, 92); // File ID of this package | 4+92

                    fileStart.write(this.#comment.slice(0, 16), 96, 'utf8'); // Comment | 16+96
                    fileStart.write('hssp 4.0.1 @ npm', 112, 'utf8'); // Used generator | 16+112

                    var offs = 128; // Start

                    // index
                    filesInBuffer.forEach(file => {
                        file = this.#files[file[3]];
                        var innerOffs = 0;
                        fileStart.writeBigUint64LE(BigInt(file[1].byteLength), offs);
                        offs += innerOffs + 8;

                        innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[0], offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[2].owner, offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                        fileStart.writeUint16LE(innerOffs, offs);
                        fileStart.write(file[2].group, offs + 2, 'utf8');
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                        fileStart.writeUint32LE(innerOffs, offs);
                        fileStart.write(file[2].webLink, offs + 4, 'utf8');
                        offs += innerOffs + 4;

                        fileStart.writeUintLE(file[2].created.getTime(), offs, 6);
                        fileStart.writeUintLE(file[2].changed.getTime(), offs + 6, 6);
                        fileStart.writeUintLE(file[2].opened.getTime(), offs + 12, 6);
                        offs += 18;

                        parseInt(file[2].permissions, 8).toString(2).split('').map(x => parseInt(x)).forEach((bit, addr) => {
                            fileStart[offs + Math.floor(addr / 8)] |= (bit << addr);
                        });
                        fileStart[offs + 1] |= (+!!file[2].isFolder << 1);
                        fileStart[offs + 1] |= (+!!file[2].hidden << 2);
                        fileStart[offs + 1] |= (+!!file[2].system << 3);
                        fileStart[offs + 1] |= (+!!file[2].enableBackup << 4);
                        fileStart[offs + 1] |= (+!!file[2].forceBackup << 5);
                        fileStart[offs + 1] |= (+!!file[2].readOnly << 6);
                        fileStart[offs + 1] |= (+!!file[2].mainFile << 7);
                        offs += 2;
                    });

                    out[i] = Buffer.concat([fileStart, out[i]]);
                    var outBuf = out[i];
                    var pack = outBuf.subarray(128, outBuf.byteLength);

                    switch (this.#compAlgo) {
                        case 'DFLT':
                            outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(deflate(pack, { level: this.#compLvl }))]);
                            break;

                        case 'LZMA':
                            outBuf = Buffer.concat([outBuf.subarray(0, 128), Buffer.from(lzma.compress(pack, this.#compLvl))]);
                            break;

                        case 'NONE':
                            break;

                        default:
                            throw new Error('COMPRESSION_NOT_SUPPORTED');
                    };

                    size = outBuf.byteLength;
                    pack = outBuf.subarray(128, size);

                    if (this.#pwd !== null) {
                        var iv = crypto.randomBytes(16);
                        var cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(this.#pwd).digest(), iv);
                        var encrypted = Buffer.concat([cipher.update(pack), cipher.final()]);
                        iv.copy(outBuf, 44);
                        encrypted.copy(outBuf, 128);
                        crypto.createHash('sha256').update(crypto.createHash('sha256').update(this.#pwd).digest()).digest().copy(outBuf, 12);
                        var eOut = Buffer.concat([outBuf.subarray(0, 128), encrypted]);
                        eOut.writeUint32LE(murmurhash.murmur3(encrypted.toString('utf8'), 0x31082007), 64);
                        out[i] = eOut;
                    } else {
                        outBuf.writeUint32LE(murmurhash.murmur3(pack.toString('utf8'), 0x31082007), 64);
                        out[i] = outBuf;
                    };
                    break;
                default:
                    throw new Error('VERSION_NOT_SUPPORTED');
            };
        };
        out.forEach((buf, i) => {
            if (out[i + 1]) out[i].writeUint32LE(murmurhash.murmur3(out[i + 1].subarray(128, out[i + 1].byteLength).toString('utf8'), 0x31082007), 88);
        });
        return out;
    }
};
module.exports = {
    release: '4.0.1',
    Editor,

    /**
     * Load all the dependencies
     * @returns {Promise<void>} A promise that resolves when all the dependencies are loaded
     * 
     * @since 3.0.0/v4
     */
    init: () => new Promise(resolve => resolve()),

    /**
     * Returns the metadata of the {buffer}
     * @param {Buffer} buffer The HSSP buffer to fetch metadata files from
     * @param {string} [password] The password to decrypt the file with (if encrypted)
     * @returns {{hash: {valid: boolean, given: number, calculated: number}, password: {correct: boolean | null, given: {clear: string, hash: string}, hash: string}, compression: string | false, split: {totalFileCount: number, id: number, checksums: {previous: number, next: number}, splitFileOffset: number}, files: object}} The metadata of the buffer
     * 
     * @since 3.0.0/v4
     * 
     * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
     * @throws {Error} "INVALID_CHECKSUM" if the checksum of the HSSP buffer is invalid
     * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
     */
    metadata: (buffer, password) => {
        buffer = Buffer.from(buffer);
        password = `${password}`;

        var metadata = {
            version: 0,
            generator: '',
            comment: '',
            hash: {
                valid: false,
                given: 0,
                calculated: 0
            },
            password: {
                correct: false,
                given: {
                    clear: '',
                    hash: ''
                },
                hash: ''
            },
            compression: '',
            split: {
                totalFileCount: 0,
                id: 0,
                checksums: {
                    previous: 0,
                    next: 0
                },
                splitFileOffset: 0
            },
            files: {}
        };

        if (buffer.subarray(0, 4).toString('utf8') == 'SFA\x00') { // v1: 0-4 SFA\x00, Uses 64B header
            metadata.version = 1;
            var inp = buffer.subarray(64, buffer.byteLength);
            metadata.hash.valid = true;
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            metadata.hash.given = buffer.readUint32LE(4);
            metadata.hash.calculated = hash;
            if (buffer.readUint32LE(4) !== hash) metadata.hash.valid = false;
            var fileCount = buffer.readUint32LE(8);

            metadata.compression = false;

            metadata.password.correct = null;
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                metadata.password.correct = false;
                metadata.password.given.hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('hex');
                metadata.password.given.clear = password;
                metadata.password.hash = buffer.subarray(12, 44).toString('hex');
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) return metadata;
                metadata.password.correct = true;
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(64, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 64);
            };

            var offs = 64;
            var index = buffer.readUint32LE(60);
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = buffer.readBigUint64LE(offs);
                metadata.files[name] = {
                    size: fileSize,
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        if (buffer.readUint32LE(4) == murmurhash.murmur3(buffer.subarray(64, buffer.byteLength).toString('utf8'), 0x31082007) && !buffer.subarray(64, 128).equals(Buffer.alloc(64).fill(0))) { // v2: Uses 64B header
            metadata.version = 2;
            var inp = buffer.subarray(64, buffer.byteLength);
            metadata.hash.valid = true;
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            metadata.hash.given = buffer.readUint32LE(4);
            metadata.hash.calculated = hash;
            if (buffer.readUint32LE(4) !== hash) metadata.hash.valid = false;
            var fileCount = buffer.readUint32LE(8);

            metadata.compression = false;

            metadata.password.correct = null;
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                metadata.password.correct = false;
                metadata.password.given.hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('hex');
                metadata.password.given.clear = password;
                metadata.password.hash = buffer.subarray(12, 44).toString('hex');
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) return metadata;
                metadata.password.correct = true;
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(64, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 64);
            };

            var offs = 64;
            var index = buffer.readUint32LE(60);
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = buffer.readBigUint64LE(offs);
                metadata.files[name] = {
                    size: fileSize,
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        if (buffer.subarray(64, 128).equals(Buffer.alloc(64).fill(0))) { // v3: Uses 128B header
            metadata.version = 3;
            var inp = buffer.subarray(128, buffer.byteLength);
            metadata.hash.valid = true;
            var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
            metadata.hash.given = buffer.readUint32LE(4);
            metadata.hash.calculated = hash;
            if (buffer.readUint32LE(4) !== hash) metadata.hash.valid = false;
            var fileCount = buffer.readUint32LE(8);

            metadata.compression = false;

            metadata.password.correct = null;
            if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                metadata.password.correct = false;
                metadata.password.given.hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('hex');
                metadata.password.given.clear = password;
                metadata.password.hash = buffer.subarray(12, 44).toString('hex');
                if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) return metadata;
                metadata.password.correct = true;
                var iv = buffer.subarray(44, 60);
                var encrypted = buffer.subarray(128, buffer.byteLength);
                var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                decrypted.copy(buffer, 128);
            };

            var offs = 128;
            var index = buffer.readUint32LE(60);
            for (var i = 0; i < fileCount; i++) {
                var nameLen = buffer.readUint16LE(offs + 8);
                var name = buffer.subarray(offs + 10, offs + 10 + nameLen).toString('utf8');
                var fileSize = buffer.readBigUint64LE(offs);
                metadata.files[name] = {
                    size: fileSize,
                    owner: '',
                    group: '',
                    webLink: '',
                    created: new Date(0),
                    changed: new Date(0),
                    opened: new Date(0),
                    permissions: 764,
                    isFolder: name.startsWith('//'),
                    hidden: false,
                    system: false,
                    enableBackup: true,
                    forceBackup: false,
                    readOnly: false,
                    mainFile: i == index
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        switch (buffer.readUint8(4)) {
            case 4: // v4: Uses 128B header completely + indexing
                metadata.version = 4;
                var inp = buffer.subarray(128, buffer.byteLength);
                metadata.hash.valid = true;
                var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
                metadata.hash.given = buffer.readUint32LE(64);
                metadata.hash.calculated = hash;
                if (buffer.readUint32LE(4) !== hash) metadata.hash.valid = false;
                var fileCount = buffer.readUint32LE(8);

                switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        metadata.compression = 'DEFLATE';
                        break;

                    case 'LZMA':
                        metadata.compression = 'LZMA';
                        break;

                    case 'NONE':
                        metadata.compression = false;
                        break;

                    default:
                        metadata.compression = null;
                        break;
                };

                metadata.password.correct = null;
                if (!buffer.subarray(12, 60).equals(Buffer.alloc(48).fill(0))) { // check if file is encrypted
                    metadata.password.correct = false;
                    metadata.password.given.hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('hex');
                    metadata.password.given.clear = password;
                    metadata.password.hash = buffer.subarray(12, 44).toString('hex');
                    if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) return metadata;
                    metadata.password.correct = true;
                    var iv = buffer.subarray(44, 60);
                    var encrypted = buffer.subarray(128, buffer.byteLength);
                    var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                    var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                    decrypted.copy(buffer, 128);
                };

                metadata.split.totalFileCount = Number(buffer.readBigUint64LE(68));
                metadata.split.id = buffer.readUint32LE(92);
                metadata.split.checksums.previous = buffer.readUint32LE(84);
                metadata.split.checksums.next = buffer.readUint32LE(88);
                metadata.split.splitFileOffset = Number(buffer.readBigUint64LE(76));

                metadata.comment = buffer.toString('utf8', 96, 112).replaceAll('\x00', '');
                metadata.generator = buffer.toString('utf8', 112, 128).replaceAll('\x00', '');

                var offs = 128;

                switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(inflate(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    case 'LZMA':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(lzma.decompress(buffer.subarray(128, buffer.byteLength)))]);
                        break;
                };

                for (var i = 0; i < fileCount; i++) {
                    var file = [];
                    file[2] = {};

                    var innerOffs = 0;
                    file[2].size = buffer.readBigUint64LE(offs);
                    offs += innerOffs + 8;

                    var innerOffs = buffer.readUint16LE(offs);
                    file[0] = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].owner = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].group = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint32LE(offs);
                    file[2].webLink = buffer.toString('utf8', offs + 4, offs + 4 + innerOffs);
                    offs += innerOffs + 4;

                    file[2].created = new Date(buffer.readUintLE(offs, 6));
                    file[2].changed = new Date(buffer.readUintLE(offs + 6, 6));
                    file[2].opened = new Date(buffer.readUintLE(offs + 12, 6));
                    offs += 18;

                    var permissions = '';
                    for (var j = 0; j < 9; j++) {
                        permissions += (buffer[offs + Math.floor(j / 8)] >> j % 8) & 1;
                    };
                    file[2].permissions = +parseInt(permissions, 2).toString(8);

                    file[2].isFolder = !!((buffer[offs + 1] >> 1) & 1);
                    file[2].hidden = !!((buffer[offs + 1] >> 2) & 1);
                    file[2].system = !!((buffer[offs + 1] >> 3) & 1);
                    file[2].enableBackup = !!((buffer[offs + 1] >> 4) & 1);
                    file[2].forceBackup = !!((buffer[offs + 1] >> 5) & 1);
                    file[2].readOnly = !!((buffer[offs + 1] >> 6) & 1);
                    file[2].mainFile = !!((buffer[offs + 1] >> 7) & 1);
                    offs += 2;

                    metadata.files[file[0]] = file[2];
                };
                return metadata;

            case 5: // v5: Uses flags
                metadata.version = 5;
                var inp = buffer.subarray(128, buffer.byteLength);
                metadata.hash.valid = true;
                var hash = murmurhash.murmur3(inp.toString('utf8'), 0x31082007);
                metadata.hash.given = buffer.readUint32LE(64);
                metadata.hash.calculated = hash;
                if (buffer.readUint32LE(4) !== hash) metadata.hash.valid = false;
                var fileCount = buffer.readUint32LE(8);
                var flags = [];
                buffer.readUint8(5).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));
                buffer.readUint8(6).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));
                buffer.readUint8(7).toString(2).split('').map(n => !!n).forEach(b => flags.push(b));

                if (flags[1]) switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        metadata.compression = 'DEFLATE';
                        break;

                    case 'LZMA':
                        metadata.compression = 'LZMA';
                        break;

                    default:
                        metadata.compression = null;
                        break;
                } else metadata.compression = false;

                metadata.password.correct = null;
                if (flags[0]) { // check if file is encrypted
                    metadata.password.correct = false;
                    metadata.password.given.hash = crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('hex');
                    metadata.password.given.clear = password;
                    metadata.password.hash = buffer.subarray(12, 44).toString('hex');
                    if (crypto.createHash('sha256').update(crypto.createHash('sha256').update(password).digest()).digest().toString('base64') !== buffer.subarray(12, 44).toString('base64')) return metadata;
                    metadata.password.correct = true;
                    var iv = buffer.subarray(44, 60);
                    var encrypted = buffer.subarray(128, buffer.byteLength);
                    var decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(password).digest(), iv);
                    var decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
                    decrypted.copy(buffer, 128);
                };

                metadata.split.totalFileCount = Number(buffer.readBigUint64LE(68));
                if (flags[2]) {
                    metadata.split.id = buffer.readUint32LE(92);
                    metadata.split.checksums.previous = buffer.readUint32LE(84);
                    metadata.split.checksums.next = buffer.readUint32LE(88);
                    metadata.split.splitFileOffset = Number(buffer.readBigUint64LE(76));
                };

                metadata.comment = buffer.toString('utf8', 96, 112).replaceAll('\x00', '');
                metadata.generator = buffer.toString('utf8', 112, 128).replaceAll('\x00', '');

                var offs = 128;

                if (flags[1]) switch (buffer.toString('utf8', 60, 64)) {
                    case 'DFLT':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(inflate(buffer.subarray(128, buffer.byteLength)))]);
                        break;

                    case 'LZMA':
                        buffer = Buffer.concat([buffer.subarray(0, 128), Buffer.from(lzma.decompress(buffer.subarray(128, buffer.byteLength)))]);
                        break;
                };

                for (var i = 0; i < fileCount; i++) {
                    var file = [];
                    file[2] = {};

                    var innerOffs = 0;
                    file[2].size = buffer.readBigUint64LE(offs);
                    offs += innerOffs + 8;

                    var innerOffs = buffer.readUint16LE(offs);
                    file[0] = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].owner = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint16LE(offs);
                    file[2].group = buffer.toString('utf8', offs + 2, offs + 2 + innerOffs);
                    offs += innerOffs + 2;

                    innerOffs = buffer.readUint32LE(offs);
                    file[2].webLink = buffer.toString('utf8', offs + 4, offs + 4 + innerOffs);
                    offs += innerOffs + 4;

                    file[2].created = new Date(buffer.readUintLE(offs, 6));
                    file[2].changed = new Date(buffer.readUintLE(offs + 6, 6));
                    file[2].opened = new Date(buffer.readUintLE(offs + 12, 6));
                    offs += 18;

                    var permissions = '';
                    for (var j = 0; j < 9; j++) {
                        permissions += (buffer[offs + Math.floor(j / 8)] >> j % 8) & 1;
                    };
                    file[2].permissions = +parseInt(permissions, 2).toString(8);

                    file[2].isFolder = !!((buffer[offs + 1] >> 1) & 1);
                    file[2].hidden = !!((buffer[offs + 1] >> 2) & 1);
                    file[2].system = !!((buffer[offs + 1] >> 3) & 1);
                    file[2].enableBackup = !!((buffer[offs + 1] >> 4) & 1);
                    file[2].forceBackup = !!((buffer[offs + 1] >> 5) & 1);
                    file[2].readOnly = !!((buffer[offs + 1] >> 6) & 1);
                    file[2].mainFile = !!((buffer[offs + 1] >> 7) & 1);
                    offs += 2;

                    metadata.files[file[0]] = file[2];
                };
                return metadata;

            default:
                if (metadata == 0) metadata.version = buffer.readUint32LE(4) > 3 ? buffer.readUint32LE(4) : null;
        };

        return metadata;
    }
};