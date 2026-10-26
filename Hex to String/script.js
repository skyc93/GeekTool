function parseHexBytes(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error('Enter hexadecimal bytes to convert.');
    }

    const withoutPrefixes = trimmed.replace(/0x/gi, '');
    const compact = withoutPrefixes.replace(/[\s,;:_-]+/g, '');

    if (!/^[0-9a-f]+$/i.test(compact)) {
        throw new Error('Hex input may contain only 0–9, A–F, 0x prefixes, and common separators.');
    }

    if (compact.length % 2 !== 0) {
        throw new Error('Hex input must contain complete byte pairs, such as A7 41.');
    }

    const bytes = new Uint8Array(compact.length / 2);
    for (let index = 0; index < compact.length; index += 2) {
        bytes[index / 2] = Number.parseInt(compact.slice(index, index + 2), 16);
    }

    return bytes;
}

function decodeHex(input, encoding) {
    const bytes = parseHexBytes(input);

    try {
        return new TextDecoder(encoding, { fatal: true }).decode(bytes);
    } catch (error) {
        if (error instanceof RangeError) {
            throw new Error(`Your browser does not support the ${encoding.toUpperCase()} decoder.`);
        }
        throw new Error(`These bytes are not valid ${encoding.toUpperCase()} text.`);
    }
}

function bytesToHex(bytes) {
    return [...bytes]
        .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
}

let big5EncodeMap = null;

function buildBig5EncodeMap() {
    if (big5EncodeMap) return big5EncodeMap;

    const decoder = new TextDecoder('big5', { fatal: false });
    big5EncodeMap = new Map();

    for (let lead = 0x81; lead <= 0xFE; lead += 1) {
        const pair = new Uint8Array(2);
        pair[0] = lead;
        for (let trail = 0x40; trail <= 0xFE; trail += 1) {
            if (trail >= 0x7F && trail <= 0xA0) continue;
            pair[1] = trail;
            const text = decoder.decode(pair);
            if (!text || text === '\uFFFD' || text.length !== 1) continue;
            if (!big5EncodeMap.has(text)) {
                big5EncodeMap.set(text, [lead, trail]);
            }
        }
    }

    return big5EncodeMap;
}

function encodeString(text, encoding) {
    if (String(text).length === 0) {
        throw new Error('Enter text to convert to hex.');
    }

    if (encoding === 'utf-8') {
        return bytesToHex(new TextEncoder().encode(text));
    }

    try {
        const map = buildBig5EncodeMap();
        const bytes = [];
        for (const char of text) {
            const code = char.codePointAt(0);
            if (code <= 0x7F) {
                bytes.push(code);
                continue;
            }
            const pair = map.get(char);
            if (!pair) {
                throw new Error(`The character “${char}” cannot be encoded as Big5.`);
            }
            bytes.push(pair[0], pair[1]);
        }
        return bytesToHex(bytes);
    } catch (error) {
        if (error instanceof RangeError) {
            throw new Error('Your browser does not support the Big5 encoder.');
        }
        throw error;
    }
}

if (typeof document !== 'undefined') {
    const hexInput = document.getElementById('hexInput');
    const encodingSelect = document.getElementById('encodingSelect');
    const resultPanel = document.getElementById('resultPanel');
    const result = document.getElementById('result');
    const errorMessage = document.getElementById('errorMessage');
    const copyBtn = document.getElementById('copyBtn');
    const resultLabel = document.getElementById('resultLabel');

    function showResult(label, value) {
        hideError(errorMessage);
        resultLabel.textContent = label;
        result.textContent = value;
        resultPanel.hidden = false;
    }

    function convertHexToString() {
        hideError(errorMessage);

        try {
            showResult('Decoded string', decodeHex(hexInput.value, encodingSelect.value));
        } catch (error) {
            resultPanel.hidden = true;
            showError(errorMessage, error.message);
        }
    }

    function convertStringToHex() {
        hideError(errorMessage);

        try {
            showResult('Hexadecimal bytes', encodeString(hexInput.value, encodingSelect.value));
        } catch (error) {
            resultPanel.hidden = true;
            showError(errorMessage, error.message);
        }
    }

    document.getElementById('convertBtn').addEventListener('click', convertHexToString);
    document.getElementById('toHexBtn').addEventListener('click', convertStringToHex);
    document.getElementById('clearBtn').addEventListener('click', () => {
        hexInput.value = '';
        result.textContent = '';
        resultPanel.hidden = true;
        hideError(errorMessage);
        hexInput.focus();
    });
    copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
    hexInput.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'Enter') {
            convertHexToString();
        }
    });
}

if (typeof module !== 'undefined') {
    module.exports = { parseHexBytes, decodeHex, encodeString, bytesToHex };
}
