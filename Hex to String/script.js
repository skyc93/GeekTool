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

if (typeof document !== 'undefined') {
    const hexInput = document.getElementById('hexInput');
    const encodingSelect = document.getElementById('encodingSelect');
    const resultPanel = document.getElementById('resultPanel');
    const result = document.getElementById('result');
    const errorMessage = document.getElementById('errorMessage');
    const copyBtn = document.getElementById('copyBtn');

    function convertHexToString() {
        hideError(errorMessage);

        try {
            result.textContent = decodeHex(hexInput.value, encodingSelect.value);
            resultPanel.hidden = false;
        } catch (error) {
            resultPanel.hidden = true;
            showError(errorMessage, error.message);
        }
    }

    document.getElementById('convertBtn').addEventListener('click', convertHexToString);
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
    module.exports = { parseHexBytes, decodeHex };
}
