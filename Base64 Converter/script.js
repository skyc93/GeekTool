function encodeBase64(value) {
    if (value.length === 0) {
        throw new Error('Enter text to encode.');
    }

    const bytes = new TextEncoder().encode(value);
    const chunkSize = 0x8000;
    let binary = '';

    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return btoa(binary);
}

function normalizeBase64(value) {
    const compact = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');

    if (!compact) {
        throw new Error('Enter Base64 text to decode.');
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
        throw new Error('Enter a valid Base64 value.');
    }

    return compact.padEnd(compact.length + ((4 - compact.length % 4) % 4), '=');
}

function base64ToBytes(value) {
    const normalized = normalizeBase64(value);

    try {
        const binary = atob(normalized);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
        throw new Error('Enter a valid Base64 value.');
    }
}

function decodeUtf8(bytes) {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        throw new Error('The Base64 value does not contain valid UTF-8 text.');
    }
}

function parseDataUrl(value) {
    const trimmed = value.trim();
    if (!trimmed.toLowerCase().startsWith('data:')) return null;

    const commaIndex = trimmed.indexOf(',');
    if (commaIndex === -1) {
        throw new Error('The data URL is missing its Base64 payload.');
    }

    const metadata = trimmed.slice(5, commaIndex).split(';');
    const mimeType = metadata[0] || 'application/octet-stream';
    const isBase64 = metadata.slice(1).some((part) => part.toLowerCase() === 'base64');

    if (!isBase64 || !/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) {
        throw new Error('Enter a valid Base64 data URL.');
    }

    return { mimeType: mimeType.toLowerCase(), payload: trimmed.slice(commaIndex + 1) };
}

function detectBinaryMimeType(bytes) {
    if (
        bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    ) return 'image/png';
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'image/jpeg';
    }
    if (
        bytes.length >= 6 &&
        String.fromCharCode(...bytes.slice(0, 6)).startsWith('GIF8')
    ) return 'image/gif';
    if (
        bytes.length >= 4 &&
        String.fromCharCode(...bytes.slice(0, 4)) === '%PDF'
    ) return 'application/pdf';

    return null;
}

function getImageDimensions(bytes, mimeType) {
    if (mimeType === 'image/png' && bytes.length >= 24) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    return null;
}

function decodeBase64Content(value) {
    const dataUrl = parseDataUrl(value);
    const bytes = base64ToBytes(dataUrl ? dataUrl.payload : value);
    const detectedMimeType = detectBinaryMimeType(bytes);
    const mimeType = dataUrl?.mimeType || detectedMimeType;
    const isText = !mimeType ||
        mimeType.startsWith('text/') ||
        /^(application\/(json|xml|javascript))$/.test(mimeType);

    if (isText) {
        return { type: 'text', text: decodeUtf8(bytes), bytes };
    }

    return {
        type: 'file',
        bytes,
        mimeType,
        dimensions: getImageDimensions(bytes, mimeType),
    };
}

function decodeBase64(value) {
    const decoded = decodeBase64Content(value);
    if (decoded.type !== 'text') {
        throw new Error(`The Base64 value contains a ${decoded.mimeType} file, not UTF-8 text.`);
    }
    return decoded.text;
}

if (typeof document !== 'undefined') {
    const inputText = document.getElementById('inputText');
    const resultPanel = document.getElementById('resultPanel');
    const resultLabel = document.getElementById('resultLabel');
    const result = document.getElementById('result');
    const errorMessage = document.getElementById('errorMessage');
    const copyBtn = document.getElementById('copyBtn');
    const filePreview = document.getElementById('filePreview');
    const imagePreview = document.getElementById('imagePreview');
    const downloadBtn = document.getElementById('downloadBtn');
    let objectUrl = null;

    const extensions = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
    };

    function resetFilePreview() {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null;
        imagePreview.removeAttribute('src');
        imagePreview.hidden = true;
        filePreview.hidden = true;
        copyBtn.hidden = false;
    }

    function showErrorState(error) {
        resetFilePreview();
        resultPanel.hidden = true;
        showError(errorMessage, error.message);
    }

    function encodeInput() {
        hideError(errorMessage);
        resetFilePreview();

        try {
            result.textContent = encodeBase64(inputText.value);
            resultLabel.textContent = 'Encoded Base64';
            resultPanel.hidden = false;
        } catch (error) {
            showErrorState(error);
        }
    }

    function decodeInput() {
        hideError(errorMessage);
        resetFilePreview();

        try {
            const decoded = decodeBase64Content(inputText.value);
            resultPanel.hidden = false;

            if (decoded.type === 'text') {
                resultLabel.textContent = 'Decoded text';
                result.textContent = decoded.text;
                return;
            }

            const size = new Intl.NumberFormat().format(decoded.bytes.length);
            const dimensions = decoded.dimensions
                ? ` • ${decoded.dimensions.width} × ${decoded.dimensions.height}px`
                : '';
            resultLabel.textContent = 'Decoded file';
            result.textContent = `${decoded.mimeType} • ${size} bytes${dimensions}`;
            copyBtn.hidden = true;
            filePreview.hidden = false;

            const blob = new Blob([decoded.bytes], { type: decoded.mimeType });
            objectUrl = URL.createObjectURL(blob);
            downloadBtn.href = objectUrl;
            downloadBtn.download = `decoded.${extensions[decoded.mimeType] || 'bin'}`;

            if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(decoded.mimeType)) {
                imagePreview.src = objectUrl;
                imagePreview.hidden = false;
            }
        } catch (error) {
            showErrorState(error);
        }
    }

    document.getElementById('encodeBtn').addEventListener('click', encodeInput);
    document.getElementById('decodeBtn').addEventListener('click', decodeInput);
    document.getElementById('clearBtn').addEventListener('click', () => {
        inputText.value = '';
        result.textContent = '';
        resultPanel.hidden = true;
        hideError(errorMessage);
        resetFilePreview();
        inputText.focus();
    });
    copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
    inputText.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'Enter') encodeInput();
    });
}

if (typeof module !== 'undefined') {
    module.exports = {
        encodeBase64,
        decodeBase64,
        decodeBase64Content,
        normalizeBase64,
        parseDataUrl,
        detectBinaryMimeType,
        getImageDimensions,
    };
}
