const inputText = document.getElementById('inputText');
const resultPanel = document.getElementById('resultPanel');
const result = document.getElementById('result');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');

function showResult(value) {
    hideError(errorMessage);
    result.textContent = value;
    resultPanel.hidden = false;
    inputText.value = value;
}

function requireText() {
    if (inputText.value.length === 0) {
        resultPanel.hidden = true;
        showError(errorMessage, 'Please enter text to trim.');
        return false;
    }
    return true;
}

document.getElementById('trimBtn').addEventListener('click', () => {
    if (!requireText()) return;
    showResult(inputText.value.trim());
});

document.getElementById('trimLinesBtn').addEventListener('click', () => {
    if (!requireText()) return;
    showResult(inputText.value.split(/\r?\n/).map((line) => line.trim()).join('\n').trim());
});

document.getElementById('collapseBtn').addEventListener('click', () => {
    if (!requireText()) return;
    showResult(
        inputText.value
            .replace(/[ \t]+/g, ' ')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    );
});

document.getElementById('clearBtn').addEventListener('click', () => {
    inputText.value = '';
    resultPanel.hidden = true;
    hideError(errorMessage);
    inputText.focus();
});

copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
