const inputText = document.getElementById('inputText');
const resultPanel = document.getElementById('resultPanel');
const result = document.getElementById('result');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');

function toHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

async function calculateSHA256() {
    hideError(errorMessage);

    const text = inputText.value;
    if (text.trim() === '') {
        resultPanel.hidden = true;
        showError(errorMessage, 'Please enter text before calculating SHA-256.');
        return;
    }

    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    result.textContent = toHex(hash);
    resultPanel.hidden = false;
}

document.getElementById('calculateBtn').addEventListener('click', () => {
    calculateSHA256().catch(() => {
        showError(errorMessage, 'Unable to calculate SHA-256 in this browser.');
    });
});
inputText.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Enter') calculateSHA256();
});
copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
