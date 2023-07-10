const compAlgos = { //> https://hssp.leox.dev/docs/compression/codes
    'DEFLATE': 'DFLT',
    'LZMA': 'LZMA'
};

const HSSP = {
    release: '3.0.0',

    _internal: {
        typedArrayToBuffer: array => array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset),
        mergeUint8Arrays: (array1, array2) => {
            var rt = new Uint8Array(array1.length + array2.length);
            rt.set(array1, 0);
            rt.set(array2, array1.length);
            return rt;
        }
    },

    Editor: class {
        #files = [];
        #pwd = null;
        #compAlgo = 'NONE';
        #compLvl = 0;
        #comment = '';
        #ver = 4;
        #idx = 0;

        /**
         * Creates a new editor
         * @since 1.0.0/v1
         */
        constructor() { }

        /**
         * Returns all included files
         * @returns {{[name: string]: {buffer: ArrayBuffer, options: {isFolder: boolean, hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}}}} All included files
         * 
         * @since 1.0.0/v1
         */
        get files() {
            var files = {};
            this.#files.forEach(file => files[file[0]] = {
                buffer: HSSP._internal.typedArrayToBuffer(file[1]),
                options: file[2]
            });
            return files;
        }

        /**
         * Adds a file to the editor
         * @param {string} name The name of the file to add
         * @param {ArrayBuffer} buffer The buffer of the file to add
         * @param {{hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}} [options] The options of the folder to add
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

                owner: options.owner ?? window.location.hostname,
                group: options.group ?? navigator.userAgent,
                created: options.created ?? new Date(),
                changed: options.changed ?? new Date(),
                opened: options.opened ?? new Date(),
                webLink: options.webLink ?? '' // A string containing a link to an exact same file on the web
            };
            (idx => this.#idx = options.mainFile ? idx : this.#idx)(this.#files.push([name, new DataView(buffer), options]));
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

                owner: options.owner ?? window.location.hostname,
                group: options.group ?? navigator.userAgent,
                created: options.created ?? new Date(),
                changed: options.changed ?? new Date(),
                opened: options.opened ?? new Date(),
                webLink: options.webLink ?? '' // A string containing a link to an exact same file on the web
            };
            (idx => this.#idx = options.mainFile ? idx : this.#idx)(this.#files.push([name, new DataView(new ArrayBuffer(0)), options]));
        }

        /**
         * Removes a file from the editor
         * @param {string} name The name of the file to remove
         * @returns {{buffer: ArrayBuffer, options: {isFolder: boolean, hidden: boolean, system: boolean, enableBackup: boolean, forceBackup: boolean, readOnly: boolean, mainFile: boolean, permissions: number, owner: string, group: string, created: Date, changed: Date, opened: Date, webLink: string}}} The removed file
         * 
         * @since 1.0.0/v1
         * 
         * @throws {Error} "FILE_NOT_FOUND" if the file was not found
         */
        remove(name) {
            var idx = this.#files.findIndex(file => file[0] == name);
            if (idx == -1) throw new Error('FILE_NOT_FOUND');
            const file = this.#files.splice(idx, 1)[0];
            return {
                buffer: HSSP._internal.typedArrayToBuffer(file[1]),
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
            this.#ver = +int < 5 && 0 < +int ? +int : this.#ver;
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
         * @param {ArrayBuffer} buffer The HSSP buffer to import files from
         * @param {string} [password] The password to decrypt the file with (if encrypted)
         * 
         * @since 1.0.0/v1
         * 
         * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
         * @throws {Error} "INVALID_CHECKSUM" if the checksum of the HSSP buffer is invalid
         * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
         * @throws {Error} "MISSING_DEPENDENCIES" if the dependencies are missing, make sure they are installed with `await HSSP.init()`
         */
        import(buffer, password) {
            if (typeof CryptoJS != 'object' && typeof murmurhash3_32_gc != 'function') throw new Error('MISSING_DEPENDENCIES');
            if (buffer.buffer instanceof ArrayBuffer) {
                buffer = buffer.buffer;
            };
            const bufferU8 = new Uint8Array(buffer);
            const bufferDV = new DataView(buffer);

            if (new TextDecoder().decode(bufferU8.subarray(0, 4)) == 'SFA\x00') { // v1: 0-4 SFA\x00, Uses 64B header
                const inp = bufferU8.subarray(64, bufferU8.length);
                const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
                const inpDV = new DataView(inp.buffer);
                if (inpDV.getUint32(4, true) !== hash) throw new Error('INVALID_CHECKSUM');
                const fileCount = bufferDV.getUint32(8, true);
                var tempDataU8;
                if ((() => {
                    const start = 12;
                    const end = 60;

                    var rt = 0;

                    for (var i = start; i < end; i++) {
                        rt += bufferDV.getUint8(i);
                    };

                    return rt !== 0;
                })()) {
                    if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) throw new Error('INVALID_PASSWORD');
                    const iv = bufferU8.subarray(44, 60);
                    const encrypted = bufferU8.subarray(64, buffer.byteLength);
                    const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                        salt: CryptoJS.lib.WordArray.create(iv)
                    }), CryptoJS.SHA256(password), {
                        iv: CryptoJS.lib.WordArray.create(iv),
                        padding: CryptoJS.pad.Pkcs7,
                        mode: CryptoJS.mode.CBC
                    });

                    tempDataU8 = decrypted.toUint8Array();
                };

                var utdu8 = true;
                const dataU8 = (() => {
                    if ((tempDataU8 ?? true) === true) {
                        utdu8 = false;
                        return inp;
                    } else return tempDataU8;
                })();
                const data = dataU8.buffer;
                const dataDV = new DataView(data);

                const usedTDU8 = utdu8;
                var offs = usedTDU8 ? 0 : 64;
                var index = bufferDV.getUint32(60, true);
                this.#idx = index;
                for (var i = 0; i < fileCount; i++) {
                    const nameLen = dataDV.getUint16(offs + 8, true);
                    const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen));
                    const fileSize = Number(dataDV.getBigUint64(offs, true));
                    this.#files.push([name, dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10 + nameLen, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen + fileSize), {
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
                        mainFile: i == index,
                    }]);
                    offs += 10 + nameLen * 2 + fileSize;
                };
                return;
            };

            if (murmurhash3_32_gc(new TextDecoder().decode(bufferU8.subarray(64, bufferU8.length)), 0x31082007) == bufferDV.getUint32(4, true)) { // v2: Uses 64B header
                const inp = bufferU8.subarray(64, bufferU8.length);
                const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
                const inpDV = new DataView(inp.buffer);
                if (inpDV.getUint32(4, true) !== hash) throw new Error('INVALID_CHECKSUM');
                const fileCount = bufferDV.getUint32(8, true);
                var tempDataU8;
                if ((() => {
                    const start = 12;
                    const end = 60;

                    var rt = 0;

                    for (var i = start; i < end; i++) {
                        rt += bufferDV.getUint8(i);
                    };

                    return rt !== 0;
                })()) {
                    if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) throw new Error('INVALID_PASSWORD');
                    const iv = bufferU8.subarray(44, 60);
                    const encrypted = bufferU8.subarray(64, buffer.byteLength);
                    const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                        salt: CryptoJS.lib.WordArray.create(iv)
                    }), CryptoJS.SHA256(password), {
                        iv: CryptoJS.lib.WordArray.create(iv),
                        padding: CryptoJS.pad.Pkcs7,
                        mode: CryptoJS.mode.CBC
                    });

                    tempDataU8 = decrypted.toUint8Array();
                };

                var utdu8 = true;
                const dataU8 = (() => {
                    if ((tempDataU8 ?? true) === true) {
                        utdu8 = false;
                        return inp;
                    } else return tempDataU8;
                })();
                const data = dataU8.buffer;
                const dataDV = new DataView(data);

                const usedTDU8 = utdu8;
                var offs = usedTDU8 ? 0 : 64;
                var index = bufferDV.getUint32(60, true);
                this.#idx = index;
                for (var i = 0; i < fileCount; i++) {
                    const nameLen = dataDV.getUint16(offs + 8, true);
                    const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen));
                    const fileSize = Number(dataDV.getBigUint64(offs, true));
                    this.#files.push([name, dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10 + nameLen, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen + fileSize), {
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
                        mainFile: i == index,
                    }]);
                    offs += 10 + nameLen * 2 + fileSize;
                };
                return;
            };

            if ((() => {
                const start = 64;
                const end = 128;

                var rt = 0;

                for (var i = start; i < end; i++) {
                    rt += bufferDV.getUint8(i);
                };

                return rt === 0;
            })()) { // v3: Uses 128B header
                const inp = bufferU8.subarray(128, bufferU8.length);
                const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
                const inpDV = new DataView(inp.buffer);
                if (inpDV.getUint32(4, true) !== hash) throw new Error('INVALID_CHECKSUM');
                const fileCount = bufferDV.getUint32(8, true);
                var tempDataU8;
                if ((() => {
                    const start = 12;
                    const end = 60;

                    var rt = 0;

                    for (var i = start; i < end; i++) {
                        rt += bufferDV.getUint8(i);
                    };

                    return rt !== 0;
                })()) {
                    if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) throw new Error('INVALID_PASSWORD');
                    const iv = bufferU8.subarray(44, 60);
                    const encrypted = bufferU8.subarray(128, buffer.byteLength);
                    const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                        salt: CryptoJS.lib.WordArray.create(iv)
                    }), CryptoJS.SHA256(password), {
                        iv: CryptoJS.lib.WordArray.create(iv),
                        padding: CryptoJS.pad.Pkcs7,
                        mode: CryptoJS.mode.CBC
                    });

                    tempDataU8 = decrypted.toUint8Array();
                };

                var utdu8 = true;
                const dataU8 = (() => {
                    if ((tempDataU8 ?? true) === true) {
                        utdu8 = false;
                        return inp;
                    } else return tempDataU8;
                })();
                const data = dataU8.buffer;
                const dataDV = new DataView(data);

                const usedTDU8 = utdu8;
                var offs = usedTDU8 ? 0 : 128;
                var index = bufferDV.getUint32(60, true);
                this.#idx = index;
                for (var i = 0; i < fileCount; i++) {
                    const nameLen = dataDV.getUint16(offs + 8, true);
                    const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 10, offs - (usedTDU8 ? 0 : 128) + 10 + nameLen));
                    const fileSize = Number(dataDV.getBigUint64(offs, true));
                    this.#files.push([name, dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 10 + nameLen, offs - (usedTDU8 ? 0 : 128) + 10 + nameLen + fileSize), {
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
                        mainFile: i == index,
                    }]);
                    offs += 10 + nameLen * 2 + fileSize;
                };
                return;
            };

            switch (bufferDV.getUint8(4)) {
                case 4: // v4: Uses 128B header completely + indexing
                    const inp = bufferU8.subarray(128, bufferU8.length);
                    const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
                    if (bufferDV.getUint32(64, true) !== hash) throw new Error('INVALID_CHECKSUM');
                    const fileCount = bufferDV.getUint32(8, true);
                    var tempDataU8;
                    if ((() => {
                        const start = 12;
                        const end = 60;

                        var rt = 0;

                        for (var i = start; i < end; i++) {
                            rt += bufferDV.getUint8(i);
                        };

                        return rt !== 0;
                    })()) {
                        if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) throw new Error('INVALID_PASSWORD');
                        const iv = bufferU8.subarray(44, 60);
                        const encrypted = bufferU8.subarray(128, buffer.byteLength);
                        const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                            ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                            salt: CryptoJS.lib.WordArray.create(iv)
                        }), CryptoJS.SHA256(password), {
                            iv: CryptoJS.lib.WordArray.create(iv),
                            padding: CryptoJS.pad.Pkcs7,
                            mode: CryptoJS.mode.CBC
                        });

                        tempDataU8 = decrypted.toUint8Array();
                    };

                    switch (new TextDecoder().decode(bufferU8.subarray(60, 64))) {
                        case 'DFLT':
                            tempDataU8 = pako.inflate(tempDataU8 ?? inp);
                            break;

                        case 'LZMA':
                            var decompressed = LZMA.decompress(tempDataU8 ?? inp);
                            tempDataU8 = (typeof decompressed == 'string') ? new TextEncoder().encode(decompressed) : Uint8Array.from(decompressed);
                            break;

                        case 'NONE':
                            break;

                        default:
                            throw new Error('COMPRESSION_NOT_SUPPORTED');
                    };

                    var utdu8 = true;
                    const dataU8 = (() => {
                        if ((tempDataU8 ?? true) === true) {
                            utdu8 = false;
                            return inp;
                        } else return tempDataU8;
                    })();
                    const data = dataU8.buffer;
                    const dataDV = new DataView(data);

                    const usedTDU8 = utdu8;
                    var offs = usedTDU8 ? 0 : 128;

                    const files = [];
                    for (var i = 0; i < fileCount; i++) {
                        var file = [];
                        file[2] = {};

                        var innerOffs = 0;
                        file[1] = dataDV.getBigUint64(offs, true);
                        file[2].size = file[1];
                        offs += innerOffs + 8;

                        var innerOffs = dataDV.getUint16(offs, true);
                        file[0] = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                        offs += innerOffs + 2;

                        innerOffs = dataDV.getUint16(offs, true);
                        file[2].owner = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                        offs += innerOffs + 2;

                        innerOffs = dataDV.getUint16(offs, true);
                        file[2].group = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                        offs += innerOffs + 2;

                        innerOffs = dataDV.getUint32(offs, true);
                        file[2].webLink = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 4, offs - (usedTDU8 ? 0 : 128) + 4 + innerOffs));
                        offs += innerOffs + 4;

                        file[2].created = new Date((() => {
                            var rt = 0;
                            for (var i = 0; i < 6; i++) {
                                rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                            };
                            return rt;
                        })());
                        offs += 6;
                        file[2].changed = new Date((() => {
                            var rt = 0;
                            for (var i = 0; i < 6; i++) {
                                rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                            };
                            return rt;
                        })());
                        offs += 6;
                        file[2].opened = new Date((() => {
                            var rt = 0;
                            for (var i = 0; i < 6; i++) {
                                rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                            };
                            return rt;
                        })());
                        offs += 6;

                        var permissions = '';
                        for (var j = 0; j < 9; j++) {
                            permissions += (dataU8[offs - (usedTDU8 ? 0 : 128) + Math.floor(j / 8)] >> j % 8) & 1;
                        };
                        file[2].permissions = +parseInt(permissions, 2).toString(8);

                        file[2].isFolder = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 1) & 1);
                        file[2].hidden = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 2) & 1);
                        file[2].system = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 3) & 1);
                        file[2].enableBackup = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 4) & 1);
                        file[2].forceBackup = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 5) & 1);
                        file[2].readOnly = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 6) & 1);
                        file[2].mainFile = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 7) & 1);
                        offs += 2;

                        files.push(file);
                    };

                    const splitFileOffset = Number(bufferDV.getBigUint64(76, true));
                    if (splitFileOffset > 0) {
                        const file = files.shift();

                        const fileStart = offs - (usedTDU8 ? 0 : 128);
                        offs += Number(file[1]) - splitFileOffset;
                        const fileEnd = offs - (usedTDU8 ? 0 : 128);
                        file[1] = dataU8.subarray(fileStart, fileEnd);

                        var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                        if (idx == -1) {
                            file[1] = (() => {
                                var rt = new Uint8Array(splitFileOffset + file[1].length);
                                rt.set(file[1], splitFileOffset);
                                return rt;
                            })();
                            this.#files.push(file);
                        } else {
                            this.#files[idx][1] = (() => {
                                var rt = new Uint8Array(this.#files[idx][1].length);
                                rt.set(this.#files[idx][1], 0);
                                rt.set(file[1], splitFileOffset);
                                return rt;
                            })();
                        };
                    };

                    files.forEach((file) => {
                        const fileStart = offs - (usedTDU8 ? 0 : 128);
                        offs += Number(file[1]);
                        const fileEnd = offs - (usedTDU8 ? 0 : 128);
                        file[1] = dataU8.subarray(fileStart, fileEnd);

                        if ((offs - (usedTDU8 ? 0 : 128)) > dataU8.byteLength) {
                            var idx = this.#files.findIndex(file2 => file2[0] == file[0]);
                            if (idx == -1) {
                                file[1] = (() => {
                                    var rt = new Uint8Array(Number(file[2].size));
                                    rt.set(file[1], 0);
                                    return rt;
                                })();
                                this.#files.push(file);
                            } else {
                                this.#files[idx][1] = (() => {
                                    var rt = new Uint8Array(this.#files[idx][1].length);
                                    rt.set(this.#files[idx][1], 0);
                                    rt.set(file[1], 0);
                                    return rt;
                                })();
                            };
                        } else {
                            this.#files.push(file);
                        };
                    });
                    return;
                default:
                    throw new Error('VERSION_NOT_SUPPORTED');
            };
        }

        /**
         * Creates a HSSP buffer
         * @returns {ArrayBuffer} The buffer
         * 
         * @since 1.0.0/v1
         * 
         * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
         * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
         * @throws {Error} "MISSING_DEPENDENCIES" if the dependencies are missing, make sure they are installed with `await HSSP.init()`
         */
        toBuffer() {
            if (typeof CryptoJS != 'object' && typeof murmurhash3_32_gc != 'function') throw new Error('MISSING_DEPENDENCIES');
            switch (this.#ver) {
                case 1:
                    var size = 64; // Bytes
                    this.#files.forEach(file => {
                        size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                    });
                    var out = new Uint8Array(size);
                    var outDV = new DataView(out.buffer);
                    out.set(new TextEncoder().encode('SFA\x00'), 0); // Magic value :) | 4+0
                    outDV.setUint32(8, this.#files.length, true); // File count | 4+8
                    for (var i = 3; i < 11; i++) {
                        outDV.setUint32(i * 4, 0, true); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var i = 0; i < 4; i++) {
                        outDV.setUint32(i * 4 + 44, 0, true); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    outDV.setUint32(60, this.#idx, true); // Index file number, 0 if not set | 4+60
                    var offs = 64; // Start
                    this.#files.forEach(file => {
                        outDV.setBigUint64(offs, BigInt(file[1].byteLength), true); // file size (up to 16 EiB!!!)
                        outDV.setUint16(offs + 8, (new TextEncoder().encode(file[0])).byteLength, true); // name size
                        out.set(new TextEncoder().encode(file[0]), offs + 10); // name
                        out.set(new Uint8Array(file[1].buffer), offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                        offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                    });
                    var pack = out.subarray(64, size);
                    if (this.#pwd !== null) {
                        const iv = CryptoJS.lib.WordArray.random(16);
                        const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(pack), CryptoJS.SHA256(this.#pwd), {
                            iv,
                            padding: CryptoJS.pad.Pkcs7,
                            mode: CryptoJS.mode.CBC
                        }).ciphertext.toUint8Array();
                        out.set(iv.toUint8Array(), 44);
                        out.set(CryptoJS.SHA256(CryptoJS.SHA256(this.#pwd)).toUint8Array(), 12);
                        const eOut = new Uint8Array(64 + encrypted.byteLength);
                        const eOutDV = new DataView(eOut.buffer);
                        eOut.set(out.subarray(0, 64), 0);
                        eOut.set(encrypted, 64);
                        eOutDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(encrypted), 0x31082007), true);
                        return eOut;
                    };
                    outDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(pack), 0x31082007), true); // checksum
                    return out.buffer;
                case 2:
                    var size = 64; // Bytes
                    this.#files.forEach(file => {
                        size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                    });
                    var out = new Uint8Array(size);
                    var outDV = new DataView(out.buffer);
                    out.set(new TextEncoder().encode('HSSP'), 0); // Magic value :) | 4+0
                    outDV.setUint32(8, this.#files.length, true); // File count | 4+8
                    for (var i = 3; i < 11; i++) {
                        outDV.setUint32(i * 4, 0, true); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var i = 0; i < 4; i++) {
                        outDV.setUint32(i * 4 + 44, 0, true); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    outDV.setUint32(60, this.#idx, true); // Index file number, 0 if not set | 4+60
                    var offs = 64; // Start
                    this.#files.forEach(file => {
                        outDV.setBigUint64(offs, BigInt(file[1].byteLength), true); // file size (up to 16 EiB!!!)
                        outDV.setUint16(offs + 8, (new TextEncoder().encode(file[0])).byteLength, true); // name size
                        out.set(new TextEncoder().encode(file[0]), offs + 10); // name
                        out.set(new Uint8Array(file[1].buffer), offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                        offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                    });
                    var pack = out.subarray(64, size);
                    if (this.#pwd !== null) {
                        const iv = CryptoJS.lib.WordArray.random(16);
                        const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(pack), CryptoJS.SHA256(this.#pwd), {
                            iv,
                            padding: CryptoJS.pad.Pkcs7,
                            mode: CryptoJS.mode.CBC
                        }).ciphertext.toUint8Array();
                        out.set(iv.toUint8Array(), 44);
                        out.set(CryptoJS.SHA256(CryptoJS.SHA256(this.#pwd)).toUint8Array(), 12);
                        const eOut = new Uint8Array(64 + encrypted.byteLength);
                        const eOutDV = new DataView(eOut.buffer);
                        eOut.set(out.subarray(0, 64), 0);
                        eOut.set(encrypted, 64);
                        eOutDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(encrypted), 0x31082007), true);
                        return eOut;
                    };
                    outDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(pack), 0x31082007), true); // checksum
                    return out.buffer;
                case 3:
                    var size = 128; // Bytes
                    this.#files.forEach(file => {
                        size += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength; // (FileSize + NameLength) + FileName + File
                    });
                    var out = new Uint8Array(size);
                    var outDV = new DataView(out.buffer);
                    out.set(new TextEncoder().encode('HSSP'), 0); // Magic value :) | 4+0
                    outDV.setUint32(8, this.#files.length, true); // File count | 4+8
                    for (var i = 3; i < 11; i++) {
                        outDV.setUint32(i * 4, 0, true); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var i = 0; i < 4; i++) {
                        outDV.setUint32(i * 4 + 44, 0, true); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    outDV.setUint32(60, this.#idx, true); // Index file number, 0 if not set | 4+60
                    var offs = 128; // Start
                    this.#files.forEach(file => {
                        outDV.setBigUint64(offs, BigInt(file[1].byteLength), true); // file size (up to 16 EiB!!!)
                        outDV.setUint16(offs + 8, (new TextEncoder().encode(file[0])).byteLength, true); // name size
                        out.set(new TextEncoder().encode(file[0]), offs + 10); // name
                        out.set(new Uint8Array(file[1].buffer), offs + 10 + (new TextEncoder().encode(file[0])).byteLength); // file
                        offs += 10 + (new TextEncoder().encode(file[0])).byteLength + (new TextEncoder().encode(file[0])).byteLength + file[1].byteLength;
                    });
                    var pack = out.subarray(128, size);
                    if (this.#pwd !== null) {
                        const iv = CryptoJS.lib.WordArray.random(16);
                        const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(pack), CryptoJS.SHA256(this.#pwd), {
                            iv,
                            padding: CryptoJS.pad.Pkcs7,
                            mode: CryptoJS.mode.CBC
                        }).ciphertext.toUint8Array();
                        out.set(iv.toUint8Array(), 44);
                        out.set(CryptoJS.SHA256(CryptoJS.SHA256(this.#pwd)).toUint8Array(), 12);
                        const eOut = new Uint8Array(128 + encrypted.byteLength);
                        const eOutDV = new DataView(eOut.buffer);
                        eOut.set(out.subarray(0, 128), 0);
                        eOut.set(encrypted, 128);
                        eOutDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(encrypted), 0x31082007), true);
                        return eOut;
                    };
                    outDV.setUint32(4, murmurhash3_32_gc(new TextDecoder().decode(pack), 0x31082007), true); // checksum
                    return out.buffer;
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
                    var out = new Uint8Array(size);
                    var outDV = new DataView(out.buffer);
                    out.set(new TextEncoder().encode('HSSP'), 0); // Magic value :) | 4+0
                    outDV.setUint8(4, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                    // these 3 bytes are reserved for future use | 3+5
                    outDV.setUint32(8, this.#files.length, true); // File count | 4+8
                    for (var i = 3; i < 11; i++) {
                        outDV.setUint32(i * 4, 0, true); // Password hash, if not set = 0 | 32+12
                        // 12 - 44
                    };
                    for (var i = 0; i < 4; i++) {
                        outDV.setUint32(i * 4 + 44, 0, true); // Encryption initialization vector (iv), if not set = 0 | 16+44
                        // 44 - 60
                    };
                    out.set(new TextEncoder().encode(this.#compAlgo), 60); // Used compression algorithm, 0 if not set | 4+60
                    // this file is not split | 28+68
                    out.set(new TextEncoder().encode(this.#comment.slice(0, 16)), 96); // Comment | 16+96
                    out.set(new TextEncoder().encode('hssp 3.0.0 WEB'), 112); // Used generator | 16+112

                    var offs = 128; // Start

                    // index
                    this.#files.forEach(file => {
                        var innerOffs = 0;
                        outDV.setBigUint64(offs, BigInt(file[1].byteLength), true);
                        offs += innerOffs + 8;

                        innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                        outDV.setUint16(offs, innerOffs, true);
                        out.set(new TextEncoder().encode(file[0]), offs + 2);
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                        outDV.setUint16(offs, innerOffs, true);
                        out.set(new TextEncoder().encode(file[2].owner), offs + 2);
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                        outDV.setUint16(offs, innerOffs, true);
                        out.set(new TextEncoder().encode(file[2].group), offs + 2);
                        offs += innerOffs + 2;

                        innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                        outDV.setUint32(offs, innerOffs, true);
                        out.set(new TextEncoder().encode(file[2].webLink), offs + 4);
                        offs += innerOffs + 4;

                        var u48c = new Uint8Array(8);
                        var u48cDV = new DataView(u48c.buffer);
                        u48cDV.setBigUint64(0, BigInt(file[2].created.getTime()), true);
                        out.set(u48c.slice(0, 6), offs);
                        u48cDV.setBigUint64(0, BigInt(file[2].changed.getTime()), true);
                        out.set(u48c.slice(0, 6), offs + 6);
                        u48cDV.setBigUint64(0, BigInt(file[2].opened.getTime()), true);
                        out.set(u48c.slice(0, 6), offs + 12);
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
                        out.set(new Uint8Array(file[1].buffer), offs); // file
                        offs += file[1].byteLength;
                    });
                    var outBuf = out;
                    var pack = outBuf.subarray(128, size);

                    switch (this.#compAlgo) {
                        case 'DFLT':
                            outBuf = HSSP._internal.mergeUint8Arrays(outBuf.subarray(0, 128), pako.deflate(pack, { level: this.#compLvl }));
                            break;

                        case 'LZMA':
                            outBuf = HSSP._internal.mergeUint8Arrays(outBuf.subarray(0, 128), LZMA.compress(pack, this.#compLvl));
                            break;

                        case 'NONE':
                            break;

                        default:
                            throw new Error('COMPRESSION_NOT_SUPPORTED');
                    };

                    size = outBuf.byteLength;
                    pack = outBuf.slice(128, size);
                    var outBufDV = new DataView(outBuf.buffer);
                    if (this.#pwd !== null) {
                        const iv = CryptoJS.lib.WordArray.random(16);
                        const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(pack), CryptoJS.SHA256(this.#pwd), {
                            iv,
                            padding: CryptoJS.pad.Pkcs7,
                            mode: CryptoJS.mode.CBC
                        }).ciphertext.toUint8Array();
                        outBuf.set(iv.toUint8Array(), 44);
                        outBuf.set(CryptoJS.SHA256(CryptoJS.SHA256(this.#pwd)).toUint8Array(), 12);
                        const eOut = new Uint8Array(128 + encrypted.byteLength);
                        const eOutDV = new DataView(eOut.buffer);
                        eOut.set(outBuf.slice(0, 128), 0);
                        eOut.set(encrypted, 128);
                        eOutDV.setUint32(64, murmurhash3_32_gc(new TextDecoder().decode(encrypted), 0x31082007), true);
                        return eOut;
                    };
                    outBufDV.setUint32(64, murmurhash3_32_gc(new TextDecoder().decode(pack), 0x31082007), true); // checksum
                    return outBuf.buffer;
            };
        }

        /**
         * Creates {count} HSSP buffers
         * @param {Number} count The amount of buffers to split the file into
         * @returns {ArrayBuffer[]} The buffers
         * 
         * @since 3.0.0/v4
         * 
         * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
         * @throws {Error} "DUDE_YOU_CANNOT_SPLIT_A_FILE_INTO_LESS_THAN_ONE_PART" if the count is less than 1
         * @throws {Error} "DUDE_YOU_CANNOT_SPLIT_SOMETHING_THAT_IS_NOT_THERE" if there are no files to split
         * @throws {Error} "TOO_MANY_FILES" if the total byte length of the package is smaller than the count
         * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
         * @throws {Error} "MISSING_DEPENDENCIES" if the dependencies are missing, make sure they are installed with `await HSSP.init()`
         */
        toBuffers(count) {
            if (typeof CryptoJS != 'object' && typeof murmurhash3_32_gc != 'function') throw new Error('MISSING_DEPENDENCIES');
            if (this.#ver !== 4) throw new Error('VERSION_NOT_SUPPORTED');
            if (count < 1) throw new Error('DUDE_YOU_CANNOT_SPLIT_A_FILE_INTO_LESS_THAN_ONE_PART');
            if (this.#files.length < 1) throw new Error('DUDE_YOU_CANNOT_SPLIT_SOMETHING_THAT_IS_NOT_THERE');
            if ((() => {
                var size = 0;
                this.#files.forEach(file => size += file[1].byteLength);
                return size <= count;
            })()) throw new Error('TOO_MANY_FILES');

            var offsets = [];
            var lengths = [];
            var bufferPool = new Uint8Array(0);
            this.#files.forEach(file => {
                offsets.push(bufferPool.byteLength);
                lengths.push(file[1].byteLength);
                var oldPool = bufferPool;
                bufferPool = new Uint8Array(oldPool.byteLength + file[1].byteLength);
                bufferPool.set(oldPool, 0);
                var fileBuf = file[1];
                console.log(fileBuf)
                var fileU8 = new Uint8Array(fileBuf);
                console.log(fileU8);
                bufferPool.set(fileU8, oldPool.byteLength);
            });

            var globalOffs = 0;
            const out = [];
            const avgSize = Math.floor(bufferPool.byteLength / count);

            for (var i = 0; i < count; i++) {
                var filesInBuffer = [];
                out[i] = new Uint8Array(avgSize + (i == 0 ? bufferPool.byteLength % count : 0));
                out[i].set(bufferPool.subarray(globalOffs, globalOffs + out[i].byteLength), 0);
                globalOffs += out[i].byteLength;

                for (var j = 0; j < this.#files.length; j++) {
                    if (offsets[j] >= globalOffs) continue;
                    if (offsets[j] + lengths[j] <= globalOffs - out[i].byteLength) continue;
                    filesInBuffer.push([this.#files[j][0], offsets[j] - (globalOffs - out[i].byteLength), lengths[j], j]);
                };

                var size = 128; // Bytes
                filesInBuffer.forEach(file => size +=
                    38 + // various constants

                    (new TextEncoder().encode(this.#files[file[3]][0])).byteLength + // File name length
                    (new TextEncoder().encode(this.#files[file[3]][2].owner)).byteLength + // Owner name length
                    (new TextEncoder().encode(this.#files[file[3]][2].group)).byteLength + // Group name length
                    (new TextEncoder().encode(this.#files[file[3]][2].webLink)).byteLength // Web link length
                );

                var fileStart = new Uint8Array(size);
                var fileStartDV = new DataView(fileStart.buffer);
                fileStart.set(new TextEncoder().encode('HSSP'), 0); // Magic value :) | 4+0
                fileStartDV.setUint8(4, 4); // File standard version, see https://hssp.leox.dev/docs/versions | 1+4
                // these 3 bytes are reserved for future use | 3+5
                fileStartDV.setUint32(8, filesInBuffer.length, true); // File count | 4+8
                for (var j = 3; j < 11; j++) {
                    fileStartDV.setUint32(j * 4, 0, true); // Password hash, if not set = 0 | 32+12
                    // 12 - 44
                };
                for (var j = 0; j < 4; j++) {
                    fileStartDV.setUint32(j * 4 + 44, 0, true); // Encryption initialization vector (iv), if not set = 0 | 16+44
                    // 44 - 60
                };
                fileStart.set(new TextEncoder().encode(this.#compAlgo), 60); // Used compression algorithm, 0 if not set | 4+60

                fileStartDV.setBigUint64(68, BigInt(this.#files.length), true); // total file count | 8+68
                fileStartDV.setBigUint64(76, BigInt(filesInBuffer[0][1] <= 0 ? Math.abs(filesInBuffer[0][1]) : 0), true); // split file offset | 8+76
                if (out[i - 1]) fileStartDV.setUint32(84, murmurhash3_32_gc(new TextDecoder().decode(out[i - 1].subarray(128, out[i - 1].byteLength)), 0x31082007), true); // Checksum of previous package | 4+84
                fileStartDV.setUint32(88, 0, true); // Checksum of next package | 4+88
                fileStartDV.setUint32(92, i, true); // File ID of this package | 4+92

                fileStart.set(new TextEncoder().encode(this.#comment.slice(0, 16)), 96); // Comment | 16+96
                fileStart.set(new TextEncoder().encode('hssp 3.0.0 WEB'), 112); // Used generator | 16+112

                var offs = 128; // Start

                // index
                filesInBuffer.forEach(file => {
                    file = this.#files[file[3]];

                    var innerOffs = 0;
                    fileStartDV.setBigUint64(offs, BigInt(file[1].byteLength), true);
                    offs += innerOffs + 8;

                    innerOffs = (new TextEncoder().encode(file[0])).byteLength;
                    fileStartDV.setUint16(offs, innerOffs, true);
                    fileStart.set(new TextEncoder().encode(file[0]), offs + 2);
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].owner)).byteLength;
                    fileStartDV.setUint16(offs, innerOffs, true);
                    fileStart.set(new TextEncoder().encode(file[2].owner), offs + 2);
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].group)).byteLength;
                    fileStartDV.setUint16(offs, innerOffs, true);
                    fileStart.set(new TextEncoder().encode(file[2].group), offs + 2);
                    offs += innerOffs + 2;

                    innerOffs = (new TextEncoder().encode(file[2].webLink)).byteLength;
                    fileStartDV.setUint32(offs, innerOffs, true);
                    fileStart.set(new TextEncoder().encode(file[2].webLink), offs + 4);
                    offs += innerOffs + 4;

                    var u48c = new Uint8Array(8);
                    var u48cDV = new DataView(u48c.buffer);
                    u48cDV.setBigUint64(0, BigInt(file[2].created.getTime()), true);
                    fileStart.set(u48c.slice(0, 6), offs);
                    u48cDV.setBigUint64(0, BigInt(file[2].changed.getTime()), true);
                    fileStart.set(u48c.slice(0, 6), offs + 6);
                    u48cDV.setBigUint64(0, BigInt(file[2].opened.getTime()), true);
                    fileStart.set(u48c.slice(0, 6), offs + 12);
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

                var oldOut = out[i];
                out[i] = new Uint8Array(fileStart.byteLength + oldOut.byteLength);
                out[i].set(fileStart, 0);
                out[i].set(oldOut, fileStart.byteLength);
                var outBuf = out[i];
                var pack = outBuf.subarray(128, outBuf.byteLength);

                switch (this.#compAlgo) {
                    case 'DFLT':
                        outBuf = HSSP._internal.mergeUint8Arrays(outBuf.subarray(0, 128), pako.deflate(pack, { level: this.#compLvl }));
                        break;

                    case 'LZMA':
                        outBuf = HSSP._internal.mergeUint8Arrays(outBuf.subarray(0, 128), LZMA.compress(pack, this.#compLvl));
                        break;

                    case 'NONE':
                        break;

                    default:
                        throw new Error('COMPRESSION_NOT_SUPPORTED');
                };

                size = outBuf.byteLength;
                pack = outBuf.slice(128, size);
                var outBufDV = new DataView(outBuf.buffer);
                if (this.#pwd !== null) {
                    const iv = CryptoJS.lib.WordArray.random(16);
                    const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(pack), CryptoJS.SHA256(this.#pwd), {
                        iv,
                        padding: CryptoJS.pad.Pkcs7,
                        mode: CryptoJS.mode.CBC
                    }).ciphertext.toUint8Array();
                    outBuf.set(iv.toUint8Array(), 44);
                    outBuf.set(CryptoJS.SHA256(CryptoJS.SHA256(this.#pwd)).toUint8Array(), 12);
                    const eOut = new Uint8Array(128 + encrypted.byteLength);
                    const eOutDV = new DataView(eOut.buffer);
                    eOut.set(outBuf.slice(0, 128), 0);
                    eOut.set(encrypted, 128);
                    eOutDV.setUint32(64, murmurhash3_32_gc(new TextDecoder().decode(encrypted), 0x31082007), true);
                    out[i] = eOut;
                } else {
                    outBufDV.setUint32(64, murmurhash3_32_gc(new TextDecoder().decode(pack), 0x31082007), true);
                    out[i] = outBuf;
                };
            };

            out.forEach((buf, i) => {
                var outDV = new DataView(out[i].buffer);
                if (out[i + 1]) outDV.setUint32(88, murmurhash3_32_gc(new TextDecoder().decode(out[i + 1].subarray(128, out[i + 1].byteLength)), 0x31082007), true);
                out[i] = out[i].buffer;
            });
            return out;
        }
    },
    dependency: {
        load: (name) => new Promise((resolve, reject) => {
            if (!HSSP.dependency.urls[name]) reject('INVALID_NAME');
            const script = document.createElement('script');
            script.onload = () => {
                if (name == 'crypto-js') CryptoJS.lib.WordArray.__proto__.toUint8Array = function () {
                    const l = this.sigBytes;
                    const words = this.words;
                    const result = new Uint8Array(l);
                    var i = 0, j = 0;
                    while (true) {
                        if (i == l)
                            break;
                        var w = words[j++];
                        result[i++] = (w & 0xff000000) >>> 24;
                        if (i == l)
                            break;
                        result[i++] = (w & 0x00ff0000) >>> 16;
                        if (i == l)
                            break;
                        result[i++] = (w & 0x0000ff00) >>> 8;
                        if (i == l)
                            break;
                        result[i++] = (w & 0x000000ff);
                    }
                    return result;
                };
                resolve();
            };
            script.src = HSSP.dependency.urls[name];
            document.body.appendChild(script);
        }),
        urls: {
            'crypto-js': 'https://cdn.jsdelivr.net/npm/crypto-js/crypto-js.min.js',
            'murmurhash-js': 'https://cdn.jsdelivr.net/gh/garycourt/murmurhash-js/murmurhash3_gc.min.js',
            'lzma-js': 'https://cdn.jsdelivr.net/npm/lzma/src/lzma_worker-min.js',
            'pako': 'https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js'
        }
    },
    init: () => Promise.all([HSSP.dependency.load('crypto-js'), HSSP.dependency.load('murmurhash-js'), HSSP.dependency.load('lzma-js'), HSSP.dependency.load('pako')]),

    /**
     * Returns the metadata of the {buffer}
     * @param {ArrayBuffer} buffer The HSSP buffer to fetch metadata files from
     * @param {string} [password] The password to decrypt the file with (if encrypted)
     * @returns {{hash: {valid: boolean, given: number, calculated: number}, password: {correct: boolean | null, given: {clear: string, hash: string}, hash: string}, compression: string | false, split: {totalFileCount: number, id: number, checksums: {previous: number, next: number}, splitFileOffset: number}, files: object}} The metadata of the buffer
     * 
     * @since 3.0.0/v4
     * 
     * @throws {Error} "VERSION_NOT_SUPPORTED" if the version is not supported
     * @throws {Error} "INVALID_CHECKSUM" if the checksum of the HSSP buffer is invalid
     * @throws {Error} "COMPRESSION_NOT_SUPPORTED" if the compression algorithm is not supported
     * @throws {Error} "MISSING_DEPENDENCIES" if the dependencies are missing, make sure they are installed with `await HSSP.init()`
     */
    metadata: (buffer, password) => {
        if (typeof CryptoJS != 'object' && typeof murmurhash3_32_gc != 'function') throw new Error('MISSING_DEPENDENCIES');
        if (buffer.buffer instanceof ArrayBuffer) {
            buffer = buffer.buffer;
        };
        const bufferU8 = new Uint8Array(buffer);
        const bufferDV = new DataView(buffer);

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

        if (new TextDecoder().decode(bufferU8.subarray(0, 4)) == 'SFA\x00') { // v1: 0-4 SFA\x00, Uses 64B header
            metadata.version = 1;
            const inp = bufferU8.subarray(64, bufferU8.length);
            metadata.hash.valid = true;
            const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
            const inpDV = new DataView(inp.buffer);
            metadata.hash.given = inpDV.getUint32(4, true);
            metadata.hash.calculated = hash;
            if (inpDV.getUint32(4, true) !== hash) metadata.hash.valid = false;
            const fileCount = bufferDV.getUint32(8, true);
            metadata.compression = false;
            metadata.password.correct = null;
            var tempDataU8;
            if ((() => {
                const start = 12;
                const end = 60;

                var rt = 0;

                for (var i = start; i < end; i++) {
                    rt += bufferDV.getUint8(i);
                };

                return rt !== 0;
            })()) {
                metadata.password.correct = false;
                metadata.password.given.hash = CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex);
                metadata.password.given.clear = password;
                metadata.password.hash = Array.from(bufferU8.subarray(12, 44)).map(e => e.toString(16).length < 2 ? '0' + e.toString(16) : e.toString(16)).join('');
                if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) return metadata;
                metadata.password.correct = true;
                const iv = bufferU8.subarray(44, 60);
                const encrypted = bufferU8.subarray(64, buffer.byteLength);
                const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                    ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                    salt: CryptoJS.lib.WordArray.create(iv)
                }), CryptoJS.SHA256(password), {
                    iv: CryptoJS.lib.WordArray.create(iv),
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC
                });

                tempDataU8 = decrypted.toUint8Array();
            };

            var utdu8 = true;
            const dataU8 = (() => {
                if ((tempDataU8 ?? true) === true) {
                    utdu8 = false;
                    return inp;
                } else return tempDataU8;
            })();
            const data = dataU8.buffer;
            const dataDV = new DataView(data);

            const usedTDU8 = utdu8;
            var offs = usedTDU8 ? 0 : 64;
            var index = bufferDV.getUint32(60, true);
            for (var i = 0; i < fileCount; i++) {
                const nameLen = dataDV.getUint16(offs + 8, true);
                const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen));
                const fileSize = dataDV.getBigUint64(offs, true);
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
                    mainFile: i == index,
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        if (murmurhash3_32_gc(new TextDecoder().decode(bufferU8.subarray(64, bufferU8.length)), 0x31082007) == bufferDV.getUint32(4, true)) { // v2: Uses 64B header
            metadata.version = 2;
            const inp = bufferU8.subarray(64, bufferU8.length);
            metadata.hash.valid = true;
            const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
            const inpDV = new DataView(inp.buffer);
            metadata.hash.given = inpDV.getUint32(4, true);
            metadata.hash.calculated = hash;
            if (inpDV.getUint32(4, true) !== hash) metadata.hash.valid = false;
            const fileCount = bufferDV.getUint32(8, true);
            metadata.compression = false;
            metadata.password.correct = null;
            var tempDataU8;
            if ((() => {
                const start = 12;
                const end = 60;

                var rt = 0;

                for (var i = start; i < end; i++) {
                    rt += bufferDV.getUint8(i);
                };

                return rt !== 0;
            })()) {
                metadata.password.correct = false;
                metadata.password.given.hash = CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex);
                metadata.password.given.clear = password;
                metadata.password.hash = Array.from(bufferU8.subarray(12, 44)).map(e => e.toString(16).length < 2 ? '0' + e.toString(16) : e.toString(16)).join('');
                if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) return metadata;
                metadata.password.correct = true;
                const iv = bufferU8.subarray(44, 60);
                const encrypted = bufferU8.subarray(64, buffer.byteLength);
                const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                    ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                    salt: CryptoJS.lib.WordArray.create(iv)
                }), CryptoJS.SHA256(password), {
                    iv: CryptoJS.lib.WordArray.create(iv),
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC
                });

                tempDataU8 = decrypted.toUint8Array();
            };

            var utdu8 = true;
            const dataU8 = (() => {
                if ((tempDataU8 ?? true) === true) {
                    utdu8 = false;
                    return inp;
                } else return tempDataU8;
            })();
            const data = dataU8.buffer;
            const dataDV = new DataView(data);

            const usedTDU8 = utdu8;
            var offs = usedTDU8 ? 0 : 64;
            var index = bufferDV.getUint32(60, true);
            for (var i = 0; i < fileCount; i++) {
                const nameLen = dataDV.getUint16(offs + 8, true);
                const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 64) + 10, offs - (usedTDU8 ? 0 : 64) + 10 + nameLen));
                const fileSize = dataDV.getBigUint64(offs, true);
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
                    mainFile: i == index,
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        if ((() => {
            const start = 64;
            const end = 128;

            var rt = 0;

            for (var i = start; i < end; i++) {
                rt += bufferDV.getUint8(i);
            };

            return rt === 0;
        })()) { // v3: Uses 128B header
            metadata.version = 3;
            const inp = bufferU8.subarray(128, bufferU8.length);
            metadata.hash.valid = true;
            const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
            const inpDV = new DataView(inp.buffer);
            metadata.hash.given = inpDV.getUint32(4, true);
            metadata.hash.calculated = hash;
            if (inpDV.getUint32(4, true) !== hash) metadata.hash.valid = false;
            const fileCount = bufferDV.getUint32(8, true);
            metadata.compression = false;
            metadata.password.correct = null;
            var tempDataU8;
            if ((() => {
                const start = 12;
                const end = 60;

                var rt = 0;

                for (var i = start; i < end; i++) {
                    rt += bufferDV.getUint8(i);
                };

                return rt !== 0;
            })()) {
                metadata.password.correct = false;
                metadata.password.given.hash = CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex);
                metadata.password.given.clear = password;
                metadata.password.hash = Array.from(bufferU8.subarray(12, 44)).map(e => e.toString(16).length < 2 ? '0' + e.toString(16) : e.toString(16)).join('');
                if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) return metadata;
                metadata.password.correct = true;
                const iv = bufferU8.subarray(44, 60);
                const encrypted = bufferU8.subarray(128, buffer.byteLength);
                const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                    ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                    salt: CryptoJS.lib.WordArray.create(iv)
                }), CryptoJS.SHA256(password), {
                    iv: CryptoJS.lib.WordArray.create(iv),
                    padding: CryptoJS.pad.Pkcs7,
                    mode: CryptoJS.mode.CBC
                });

                tempDataU8 = decrypted.toUint8Array();
            };

            var utdu8 = true;
            const dataU8 = (() => {
                if ((tempDataU8 ?? true) === true) {
                    utdu8 = false;
                    return inp;
                } else return tempDataU8;
            })();
            const data = dataU8.buffer;
            const dataDV = new DataView(data);

            const usedTDU8 = utdu8;
            var offs = usedTDU8 ? 0 : 128;
            var index = bufferDV.getUint32(60, true);
            for (var i = 0; i < fileCount; i++) {
                const nameLen = dataDV.getUint16(offs + 8, true);
                const name = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 10, offs - (usedTDU8 ? 0 : 128) + 10 + nameLen));
                const fileSize = dataDV.getBigUint64(offs, true);
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
                    mainFile: i == index,
                };
                offs += 10 + nameLen * 2 + Number(fileSize);
            };
            metadata.split.totalFileCount = fileCount;
            return metadata;
        };

        switch (bufferDV.getUint8(4)) {
            case 4: // v4: Uses 128B header completely + indexing
                metadata.version = 4;
                const inp = bufferU8.subarray(128, bufferU8.length);
                metadata.hash.valid = true;
                const hash = murmurhash3_32_gc(new TextDecoder().decode(inp), 0x31082007);
                metadata.hash.given = bufferDV.getUint32(64, true);
                metadata.hash.calculated = hash;
                if (bufferDV.getUint32(64, true) !== hash) metadata.hash.valid = false;
                const fileCount = bufferDV.getUint32(8, true);
                switch (new TextDecoder().decode(bufferU8.subarray(60, 64))) {
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
                var tempDataU8;
                if ((() => {
                    const start = 12;
                    const end = 60;

                    var rt = 0;

                    for (var i = start; i < end; i++) {
                        rt += bufferDV.getUint8(i);
                    };

                    return rt !== 0;
                })()) {
                    metadata.password.correct = false;
                    metadata.password.given.hash = CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex);
                    metadata.password.given.clear = password;
                    metadata.password.hash = Array.from(bufferU8.subarray(12, 44)).map(e => e.toString(16).length < 2 ? '0' + e.toString(16) : e.toString(16)).join('');
                    if (CryptoJS.SHA256(CryptoJS.SHA256(password)).toString(CryptoJS.enc.Hex) !== bufferU8.subarray(12, 44).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')) return metadata;
                    metadata.password.correct = true;
                    const iv = bufferU8.subarray(44, 60);
                    const encrypted = bufferU8.subarray(128, buffer.byteLength);
                    const decrypted = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.lib.WordArray.create(encrypted),
                        salt: CryptoJS.lib.WordArray.create(iv)
                    }), CryptoJS.SHA256(password), {
                        iv: CryptoJS.lib.WordArray.create(iv),
                        padding: CryptoJS.pad.Pkcs7,
                        mode: CryptoJS.mode.CBC
                    });

                    tempDataU8 = decrypted.toUint8Array();
                };

                switch (new TextDecoder().decode(bufferU8.subarray(60, 64))) {
                    case 'DFLT':
                        tempDataU8 = pako.inflate(tempDataU8 ?? inp);
                        break;

                    case 'LZMA':
                        var decompressed = LZMA.decompress(tempDataU8 ?? inp);
                        tempDataU8 = (typeof decompressed == 'string') ? new TextEncoder().encode(decompressed) : Uint8Array.from(decompressed);
                        break;
                };

                var utdu8 = true;
                const dataU8 = (() => {
                    if ((tempDataU8 ?? true) === true) {
                        utdu8 = false;
                        return inp;
                    } else return tempDataU8;
                })();
                const data = dataU8.buffer;
                const dataDV = new DataView(data);

                metadata.split.totalFileCount = Number(bufferDV.getBigUint64(68, true));
                metadata.split.id = bufferDV.getUint32(92, true);
                metadata.split.checksums.previous = bufferDV.getUint32(84, true);
                metadata.split.checksums.next = bufferDV.getUint32(88, true);
                metadata.split.splitFileOffset = Number(bufferDV.getBigUint64(76, true));

                metadata.comment = new TextDecoder().decode(bufferU8.subarray(96, 112)).split('\x00', '');

                metadata.generator = new TextDecoder().decode(bufferU8.subarray(112, 128)).split('\x00', '');

                const usedTDU8 = utdu8;
                var offs = usedTDU8 ? 0 : 128;

                for (var i = 0; i < fileCount; i++) {
                    var file = [];
                    file[2] = {};

                    var innerOffs = 0;
                    file[2].size = dataDV.getBigUint64(offs, true);
                    offs += innerOffs + 8;

                    var innerOffs = dataDV.getUint16(offs, true);
                    file[0] = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                    offs += innerOffs + 2;

                    innerOffs = dataDV.getUint16(offs, true);
                    file[2].owner = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                    offs += innerOffs + 2;

                    innerOffs = dataDV.getUint16(offs, true);
                    file[2].group = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 2, offs - (usedTDU8 ? 0 : 128) + 2 + innerOffs));
                    offs += innerOffs + 2;

                    innerOffs = dataDV.getUint32(offs, true);
                    file[2].webLink = new TextDecoder().decode(dataU8.subarray(offs - (usedTDU8 ? 0 : 128) + 4, offs - (usedTDU8 ? 0 : 128) + 4 + innerOffs));
                    offs += innerOffs + 4;

                    file[2].created = new Date((() => {
                        var rt = 0;
                        for (var i = 0; i < 6; i++) {
                            rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                        };
                        return rt;
                    })());
                    offs += 6;
                    file[2].changed = new Date((() => {
                        var rt = 0;
                        for (var i = 0; i < 6; i++) {
                            rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                        };
                        return rt;
                    })());
                    offs += 6;
                    file[2].opened = new Date((() => {
                        var rt = 0;
                        for (var i = 0; i < 6; i++) {
                            rt += dataDV.getUint8(offs + i) * Math.pow(256, i);
                        };
                        return rt;
                    })());
                    offs += 6;

                    var permissions = '';
                    for (var j = 0; j < 9; j++) {
                        permissions += (dataU8[offs - (usedTDU8 ? 0 : 128) + Math.floor(j / 8)] >> j % 8) & 1;
                    };
                    file[2].permissions = +parseInt(permissions, 2).toString(8);

                    file[2].isFolder = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 1) & 1);
                    file[2].hidden = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 2) & 1);
                    file[2].system = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 3) & 1);
                    file[2].enableBackup = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 4) & 1);
                    file[2].forceBackup = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 5) & 1);
                    file[2].readOnly = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 6) & 1);
                    file[2].mainFile = !!((dataU8[offs - (usedTDU8 ? 0 : 128) + 1] >> 7) & 1);
                    offs += 2;

                    metadata.files[file[0]] = file[2];
                };
                return metadata;
            default:
                if (metadata == 0) metadata.version = bufferDV.getUint8(4) > 3 ? bufferDV.getUint8(4) : null;
        };
        return metadata;
    }
};