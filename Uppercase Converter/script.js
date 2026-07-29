const inputText = document.getElementById('inputText');
const resultPanel = document.getElementById('resultPanel');
const result = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');

function convertToUppercase() {
    const text = inputText.value;
    if (text.trim() === '') {
        resultPanel.hidden = true;
        return;
    }

    const upper = text.toUpperCase();
    result.textContent = upper;
    resultPanel.hidden = false;
}

inputText.addEventListener('input', convertToUppercase);
document.getElementById('convertBtn').addEventListener('click', convertToUppercase);
document.getElementById('clearBtn').addEventListener('click', () => {
    inputText.value = '';
    resultPanel.hidden = true;
    inputText.focus();
});
copyBtn.addEventListener('click', () => copyText(result.textContent, copyBtn));
