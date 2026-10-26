const generateBtn = document.getElementById('generateBtn');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const copyCipherBtn = document.getElementById('copyCipherBtn');
const clearBtn = document.getElementById('clearBtn');
const publicKeyInput = document.getElementById('publicKey');
const privateKeyInput = document.getElementById('privateKey');
const plainText = document.getElementById('plainText');
const cipherText = document.getElementById('cipherText');
const errorMessage = document.getElementById('errorMessage');
const statusMessage = document.getElementById('statusMessage');

function showStatus(message) {
    hideError(errorMessage);
    statusMessage.textContent = message;
    statusMessage.hidden = false;
}

function showProblem(message) {
    statusMessage.hidden = true;
    showError(errorMessage, message);
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function base64ToArrayBuffer(value) {
    const binary = atob(value.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}

function toPem(buffer, label) {
    const body = arrayBufferToBase64(buffer).match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

function fromPem(pem, expected) {
    const match = String(pem).match(/-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/);
    if (!match) {
        throw new Error(`Paste a valid ${expected} PEM.`);
    }
    return base64ToArrayBuffer(match[2]);
}

async function importPublicKey(pem) {
    return crypto.subtle.importKey(
        'spki',
        fromPem(pem, 'PUBLIC KEY'),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}

async function importPrivateKey(pem) {
    return crypto.subtle.importKey(
        'pkcs8',
        fromPem(pem, 'PRIVATE KEY'),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
    );
}

generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    showStatus('Generating RSA-2048 key pair…');
    try {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt']
        );
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
        publicKeyInput.value = toPem(publicKey, 'PUBLIC KEY');
        privateKeyInput.value = toPem(privateKey, 'PRIVATE KEY');
        showStatus('Key pair ready. Keep the private key on this machine.');
    } catch (error) {
        showProblem(error.message || 'Unable to generate a key pair in this browser.');
    } finally {
        generateBtn.disabled = false;
    }
});

encryptBtn.addEventListener('click', async () => {
    if (!publicKeyInput.value.trim()) {
        showProblem('Generate or paste a public key first.');
        return;
    }
    if (!plainText.value) {
        showProblem('Enter plain text to encrypt.');
        return;
    }

    try {
        const key = await importPublicKey(publicKeyInput.value);
        const data = new TextEncoder().encode(plainText.value);
        const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
        cipherText.value = arrayBufferToBase64(encrypted);
        showStatus('Encrypted with the public key.');
    } catch (error) {
        showProblem(error.message || 'Encryption failed. RSA-OAEP 2048 fits about 190 bytes of text.');
    }
});

decryptBtn.addEventListener('click', async () => {
    if (!privateKeyInput.value.trim()) {
        showProblem('Generate or paste a private key first.');
        return;
    }
    if (!cipherText.value.trim()) {
        showProblem('Paste Base64 cipher text to decrypt.');
        return;
    }

    try {
        const key = await importPrivateKey(privateKeyInput.value);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            key,
            base64ToArrayBuffer(cipherText.value)
        );
        plainText.value = new TextDecoder().decode(decrypted);
        showStatus('Decrypted with the private key.');
    } catch (error) {
        showProblem(error.message || 'Decryption failed. Check the private key and cipher text.');
    }
});

copyCipherBtn.addEventListener('click', () => {
    if (!cipherText.value.trim()) {
        showProblem('Nothing to copy yet.');
        return;
    }
    copyText(cipherText.value, copyCipherBtn);
});

clearBtn.addEventListener('click', () => {
    publicKeyInput.value = '';
    privateKeyInput.value = '';
    plainText.value = '';
    cipherText.value = '';
    statusMessage.hidden = true;
    hideError(errorMessage);
    plainText.focus();
});
