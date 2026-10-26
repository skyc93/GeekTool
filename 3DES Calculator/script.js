const IP = [
    58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
];

const FP = [
    40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25,
];

const E = [
    32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1,
];

const P = [
    16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
    2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
];

const PC1 = [
    57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
];

const PC2 = [
    14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32,
];

const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

const SBOX = [
    [
        14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
        0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
        4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
        15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13,
    ],
    [
        15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10,
        3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5,
        0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15,
        13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9,
    ],
    [
        10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8,
        13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
        13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7,
        1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12,
    ],
    [
        7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15,
        13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
        10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4,
        3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14,
    ],
    [
        2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9,
        14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
        4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14,
        11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3,
    ],
    [
        12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11,
        10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
        9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6,
        4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13,
    ],
    [
        4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1,
        13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
        1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2,
        6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12,
    ],
    [
        13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7,
        1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
        7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8,
        2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11,
    ],
];

function bytesToBits(bytes) {
    const bits = new Array(bytes.length * 8);
    let index = 0;
    for (const value of bytes) {
        for (let bit = 7; bit >= 0; bit -= 1) {
            bits[index] = (value >> bit) & 1;
            index += 1;
        }
    }
    return bits;
}

function bitsToBytes(bits) {
    const bytes = new Uint8Array(bits.length / 8);
    for (let i = 0; i < bytes.length; i += 1) {
        let value = 0;
        for (let bit = 0; bit < 8; bit += 1) {
            value = (value << 1) | bits[i * 8 + bit];
        }
        bytes[i] = value;
    }
    return bytes;
}

function permute(bits, table) {
    return table.map((position) => bits[position - 1]);
}

function rotateLeft(bits, count) {
    return bits.slice(count).concat(bits.slice(0, count));
}

function xorBits(left, right) {
    return left.map((bit, index) => bit ^ right[index]);
}

function sboxSubstitute(bits) {
    const output = [];
    for (let box = 0; box < 8; box += 1) {
        const chunk = bits.slice(box * 6, box * 6 + 6);
        const row = (chunk[0] << 1) | chunk[5];
        const column = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
        const value = SBOX[box][row * 16 + column];
        output.push((value >> 3) & 1, (value >> 2) & 1, (value >> 1) & 1, value & 1);
    }
    return output;
}

function createSubkeys(keyBytes) {
    const keyBits = permute(bytesToBits(keyBytes), PC1);
    let left = keyBits.slice(0, 28);
    let right = keyBits.slice(28);
    const subkeys = [];

    for (const shift of SHIFTS) {
        left = rotateLeft(left, shift);
        right = rotateLeft(right, shift);
        subkeys.push(permute(left.concat(right), PC2));
    }

    return subkeys;
}

function feistel(right, subkey) {
    return permute(sboxSubstitute(xorBits(permute(right, E), subkey)), P);
}

function desBlock(blockBytes, subkeys, decrypt = false) {
    const bits = permute(bytesToBits(blockBytes), IP);
    let left = bits.slice(0, 32);
    let right = bits.slice(32);
    const schedule = decrypt ? [...subkeys].reverse() : subkeys;

    for (const subkey of schedule) {
        const nextLeft = right;
        right = xorBits(left, feistel(right, subkey));
        left = nextLeft;
    }

    return bitsToBytes(permute(right.concat(left), FP));
}

function splitKey(keyBytes) {
    if (keyBytes.length === 24) {
        return [keyBytes.slice(0, 8), keyBytes.slice(8, 16), keyBytes.slice(16, 24)];
    }
    if (keyBytes.length === 16) {
        return [keyBytes.slice(0, 8), keyBytes.slice(8, 16), keyBytes.slice(0, 8)];
    }
    throw new Error('3DES key must be 16 bytes (2-key) or 24 bytes (3-key).');
}

function tripleDesBlock(blockBytes, keyBytes, decrypt = false) {
    const [k1, k2, k3] = splitKey(keyBytes);
    const keys = decrypt ? [k3, k2, k1] : [k1, k2, k3];
    const decryptFlags = decrypt ? [true, false, true] : [false, true, false];

    let block = blockBytes;
    for (let index = 0; index < 3; index += 1) {
        block = desBlock(block, createSubkeys(keys[index]), decryptFlags[index]);
    }
    return block;
}

function pkcs7Pad(bytes) {
    const pad = 8 - (bytes.length % 8);
    const padded = new Uint8Array(bytes.length + pad);
    padded.set(bytes);
    padded.fill(pad, bytes.length);
    return padded;
}

function pkcs7Unpad(bytes) {
    if (bytes.length === 0 || bytes.length % 8 !== 0) {
        throw new Error('Ciphertext length must be a multiple of 8 bytes.');
    }

    const pad = bytes[bytes.length - 1];
    if (pad < 1 || pad > 8 || bytes.length < pad) {
        throw new Error('Ciphertext padding is invalid.');
    }

    for (let index = bytes.length - pad; index < bytes.length; index += 1) {
        if (bytes[index] !== pad) {
            throw new Error('Ciphertext padding is invalid.');
        }
    }

    return bytes.slice(0, bytes.length - pad);
}

function xorBlocks(left, right) {
    const output = new Uint8Array(8);
    for (let index = 0; index < 8; index += 1) {
        output[index] = left[index] ^ right[index];
    }
    return output;
}

function processBlocks(bytes, keyBytes, ivBytes, mode, decrypt) {
    const output = new Uint8Array(bytes.length);
    let previous = ivBytes ? Uint8Array.from(ivBytes) : null;

    for (let offset = 0; offset < bytes.length; offset += 8) {
        const block = bytes.slice(offset, offset + 8);
        let result;

        if (mode === 'ECB') {
            result = tripleDesBlock(block, keyBytes, decrypt);
        } else if (decrypt) {
            result = xorBlocks(tripleDesBlock(block, keyBytes, true), previous);
            previous = block;
        } else {
            result = tripleDesBlock(xorBlocks(block, previous), keyBytes, false);
            previous = result;
        }

        output.set(result, offset);
    }

    return output;
}

function parseHexBytes(input, label) {
    const compact = String(input).trim().replace(/0x/gi, '').replace(/[\s,;:_-]+/g, '');
    if (!compact) {
        throw new Error(`Enter the ${label}.`);
    }
    if (!/^[0-9a-f]+$/i.test(compact)) {
        throw new Error(`${label} hex may contain only 0–9, A–F, 0x prefixes, and common separators.`);
    }
    if (compact.length % 2 !== 0) {
        throw new Error(`${label} hex must contain complete byte pairs.`);
    }

    const bytes = new Uint8Array(compact.length / 2);
    for (let index = 0; index < compact.length; index += 2) {
        bytes[index / 2] = Number.parseInt(compact.slice(index, index + 2), 16);
    }
    return bytes;
}

function parseUtf8Bytes(input, label) {
    if (!String(input).length) {
        throw new Error(`Enter the ${label}.`);
    }
    return new TextEncoder().encode(input);
}

function parseBytes(input, format, label) {
    return format === 'hex' ? parseHexBytes(input, label) : parseUtf8Bytes(input, label);
}

function bytesToHex(bytes) {
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
}

function parseBase64Bytes(input, label) {
    const compact = String(input).trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!compact) {
        throw new Error(`Enter the ${label}.`);
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
        throw new Error(`${label} is not valid Base64.`);
    }

    const padded = compact.padEnd(compact.length + ((4 - compact.length % 4) % 4), '=');
    try {
        const binary = atob(padded);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
        throw new Error(`${label} is not valid Base64.`);
    }
}

function parseInputBytes(input, format, label) {
    if (format === 'hex') return parseHexBytes(input, label);
    if (format === 'base64') return parseBase64Bytes(input, label);
    return parseUtf8Bytes(input, label);
}

function bytesToUtf8(bytes) {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return null;
    }
}

function tripleDesCrypt({
    operation,
    mode,
    padding,
    input,
    inputFormat,
    key,
    keyFormat,
    iv,
    ivFormat,
}) {
    const keyBytes = parseBytes(key, keyFormat, 'key');
    splitKey(keyBytes);

    let ivBytes = null;
    if (mode === 'CBC') {
        ivBytes = parseBytes(iv, ivFormat, 'IV');
        if (ivBytes.length !== 8) {
            throw new Error('CBC IV must be exactly 8 bytes.');
        }
    } else if (mode !== 'ECB') {
        throw new Error('Mode must be ECB or CBC.');
    }

    const source = parseInputBytes(input, inputFormat, operation === 'encrypt' ? 'plaintext' : 'ciphertext');
    const decrypt = operation === 'decrypt';
    let data = source;

    if (!decrypt && padding === 'pkcs7') {
        data = pkcs7Pad(source);
    } else if (data.length === 0 || data.length % 8 !== 0) {
        throw new Error(decrypt
            ? 'Ciphertext length must be a multiple of 8 bytes.'
            : 'No-padding input must be a multiple of 8 bytes.');
    }

    let output = processBlocks(data, keyBytes, ivBytes, mode, decrypt);
    if (decrypt && padding === 'pkcs7') {
        output = pkcs7Unpad(output);
    }

    return {
        bytes: output,
        hex: bytesToHex(output),
        base64: bytesToBase64(output),
        utf8: bytesToUtf8(output),
    };
}

if (typeof document !== 'undefined') {
    const operationSelect = document.getElementById('operationSelect');
    const modeSelect = document.getElementById('modeSelect');
    const paddingSelect = document.getElementById('paddingSelect');
    const inputFormatSelect = document.getElementById('inputFormatSelect');
    const keyFormatSelect = document.getElementById('keyFormatSelect');
    const ivFormatSelect = document.getElementById('ivFormatSelect');
    const inputText = document.getElementById('inputText');
    const keyInput = document.getElementById('keyInput');
    const ivInput = document.getElementById('ivInput');
    const ivSection = document.getElementById('ivSection');
    const errorMessage = document.getElementById('errorMessage');
    const resultPanel = document.getElementById('resultPanel');
    const hexResult = document.getElementById('hexResult');
    const base64Result = document.getElementById('base64Result');
    const utf8Result = document.getElementById('utf8Result');
    const utf8ResultBlock = document.getElementById('utf8ResultBlock');

    function syncModeUi() {
        const isCbc = modeSelect.value === 'CBC';
        ivSection.hidden = !isCbc;
        document.getElementById('ivFormatSection').hidden = !isCbc;
        ivInput.required = isCbc;
    }

    function syncOperationUi() {
        const isEncrypt = operationSelect.value === 'encrypt';
        utf8ResultBlock.hidden = isEncrypt;
        inputText.placeholder = isEncrypt
            ? 'Enter hex data, e.g. 48656C6C6F'
            : 'Enter ciphertext as hex…';
    }

    function run() {
        hideError(errorMessage);
        resultPanel.hidden = true;

        try {
            const result = tripleDesCrypt({
                operation: operationSelect.value,
                mode: modeSelect.value,
                padding: paddingSelect.value,
                input: inputText.value,
                inputFormat: inputFormatSelect.value,
                key: keyInput.value,
                keyFormat: keyFormatSelect.value,
                iv: ivInput.value,
                ivFormat: ivFormatSelect.value,
            });

            hexResult.textContent = result.hex;
            base64Result.textContent = result.base64;
            utf8Result.textContent = result.utf8 ?? 'Not valid UTF-8 text. Use hex or Base64 output.';
            resultPanel.hidden = false;
        } catch (error) {
            showError(errorMessage, error.message);
        }
    }

    document.getElementById('runBtn').addEventListener('click', run);
    document.getElementById('clearBtn').addEventListener('click', () => {
        inputText.value = '';
        keyInput.value = '';
        ivInput.value = '';
        hexResult.textContent = '';
        base64Result.textContent = '';
        utf8Result.textContent = '';
        resultPanel.hidden = true;
        hideError(errorMessage);
        inputText.focus();
    });
    document.getElementById('copyHexBtn').addEventListener('click', (event) => {
        copyText(hexResult.textContent, event.currentTarget);
    });
    document.getElementById('copyBase64Btn').addEventListener('click', (event) => {
        copyText(base64Result.textContent, event.currentTarget);
    });
    document.getElementById('copyUtf8Btn').addEventListener('click', (event) => {
        copyText(utf8Result.textContent, event.currentTarget);
    });
    modeSelect.addEventListener('change', syncModeUi);
    operationSelect.addEventListener('change', syncOperationUi);

    syncModeUi();
    syncOperationUi();
}

if (typeof module !== 'undefined') {
    module.exports = {
        tripleDesCrypt,
        parseHexBytes,
        bytesToHex,
        pkcs7Pad,
        pkcs7Unpad,
    };
}
